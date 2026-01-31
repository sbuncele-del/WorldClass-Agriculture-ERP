/**
 * ProposalLivePreview - Real-time preview of the proposal
 */

import React from 'react';
import { Typography, Divider, Space, Tag, Table } from 'antd';
import type { ProposalData } from '../WorldClassProposalBuilder';

const { Title, Text, Paragraph } = Typography;

interface ProposalLivePreviewProps {
  proposal: ProposalData;
}

const ProposalLivePreview: React.FC<ProposalLivePreviewProps> = ({ proposal }) => {
  const { design, sections, client, type } = proposal;
  
  const renderSection = (section: typeof sections[0]) => {
    // Parse markdown-style content
    const formatContent = (content: string) => {
      if (!content) return null;
      
      // Split by double newlines for paragraphs
      const paragraphs = content.split('\n\n');
      
      return paragraphs.map((para, i) => {
        // Check for headers
        if (para.startsWith('**') && para.endsWith('**')) {
          return (
            <Title key={i} level={5} style={{ 
              color: design.primaryColor,
              fontFamily: design.fontPrimary,
              marginTop: i > 0 ? 16 : 0
            }}>
              {para.replace(/\*\*/g, '')}
            </Title>
          );
        }
        
        // Check for bullet lists
        if (para.includes('\n•') || para.startsWith('•')) {
          const items = para.split('\n').filter(line => line.trim().startsWith('•'));
          return (
            <ul key={i} style={{ paddingLeft: 20, marginBottom: 16 }}>
              {items.map((item, j) => (
                <li key={j} style={{ marginBottom: 4 }}>
                  {item.replace('•', '').trim()}
                </li>
              ))}
            </ul>
          );
        }
        
        // Check for numbered lists
        if (/^\d+\./.test(para)) {
          const items = para.split('\n').filter(line => /^\d+\./.test(line.trim()));
          return (
            <ol key={i} style={{ paddingLeft: 20, marginBottom: 16 }}>
              {items.map((item, j) => (
                <li key={j} style={{ marginBottom: 8 }}>
                  {item.replace(/^\d+\.\s*/, '').trim()}
                </li>
              ))}
            </ol>
          );
        }
        
        // Regular paragraph
        return (
          <Paragraph key={i} style={{ 
            fontFamily: design.fontSecondary,
            marginBottom: 12,
            lineHeight: 1.8
          }}>
            {para}
          </Paragraph>
        );
      });
    };
    
    return (
      <div key={section.id} style={{ marginBottom: 32, pageBreakInside: 'avoid' }}>
        <Title level={4} style={{ 
          color: design.primaryColor,
          fontFamily: design.fontPrimary,
          borderBottom: `2px solid ${design.accentColor}`,
          paddingBottom: 8
        }}>
          {section.title}
        </Title>
        <div style={{ fontFamily: design.fontSecondary }}>
          {formatContent(section.content)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      background: 'white',
      minHeight: '100%',
      fontFamily: design.fontSecondary
    }}>
      {/* Cover Page */}
      <div style={{
        background: `linear-gradient(135deg, ${design.primaryColor} 0%, ${design.accentColor} 100%)`,
        color: 'white',
        padding: '60px 40px',
        marginBottom: 40,
        borderRadius: 8
      }}>
        <div style={{ 
          textAlign: design.logoPosition,
          marginBottom: 40
        }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.2)',
            padding: '12px 24px',
            borderRadius: 8
          }}>
            <Text style={{ color: 'white', fontSize: 16 }}>
              {/* Company logo placeholder */}
              Your Company
            </Text>
          </div>
        </div>
        
        <Title style={{ 
          color: 'white', 
          fontFamily: design.fontPrimary,
          fontSize: 36,
          marginBottom: 16
        }}>
          {proposal.title || 'Untitled Proposal'}
        </Title>
        
        <Title level={3} style={{ 
          color: 'rgba(255,255,255,0.9)',
          fontFamily: design.fontPrimary,
          fontWeight: 400
        }}>
          Prepared for {client?.company || 'Client'}
        </Title>
        
        <Divider style={{ borderColor: 'rgba(255,255,255,0.3)', margin: '32px 0' }} />
        
        <Space size="large">
          {type && <Tag color="white" style={{ color: design.primaryColor }}>{type.name}</Tag>}
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
            {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </Space>
      </div>
      
      {/* Table of Contents */}
      {design.showTableOfContents && sections.length > 0 && (
        <div style={{ marginBottom: 40, padding: '0 40px' }}>
          <Title level={4} style={{ 
            color: design.primaryColor,
            fontFamily: design.fontPrimary
          }}>
            Table of Contents
          </Title>
          <div style={{ columns: 2, columnGap: 40 }}>
            {sections.filter(s => s.visible).map((section, index) => (
              <div 
                key={section.id}
                style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px dotted #e8e8e8',
                  breakInside: 'avoid'
                }}
              >
                <Text>{section.title}</Text>
                <Text type="secondary">{index + 1}</Text>
              </div>
            ))}
          </div>
          <Divider />
        </div>
      )}
      
      {/* Content Sections */}
      <div style={{ padding: '0 40px' }}>
        {sections
          .filter(s => s.visible)
          .sort((a, b) => a.order - b.order)
          .map(section => renderSection(section))}
      </div>
      
      {/* Footer */}
      <div style={{
        marginTop: 60,
        padding: '20px 40px',
        borderTop: `2px solid ${design.primaryColor}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Confidential - Prepared exclusively for {client?.company || 'Client'}
        </Text>
        {design.showPageNumbers && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Page 1
          </Text>
        )}
      </div>
    </div>
  );
};

export default ProposalLivePreview;
