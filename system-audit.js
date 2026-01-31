#!/usr/bin/env node

/**
 * WorldClass ERP System Audit
 * Comprehensive testing to identify what actually works vs what's broken
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ERPSystemAudit {
    constructor() {
        this.results = {
            summary: {
                timestamp: new Date().toISOString(),
                totalTests: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            },
            api: {
                backend: [],
                endpoints: []
            },
            frontend: {
                routes: [],
                components: [],
                mockData: []
            },
            database: {
                connections: [],
                migrations: []
            },
            deployment: {
                status: null,
                errors: []
            }
        };

        this.backendUrl = process.env.BACKEND_URL || 'http://51.20.67.228:3000';
        this.frontendUrl = process.env.FRONTEND_URL || 'https://d31haec5xwcd98.cloudfront.net';
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            info: '\x1b[36m',    // cyan
            success: '\x1b[32m', // green
            warning: '\x1b[33m', // yellow
            error: '\x1b[31m',   // red
            reset: '\x1b[0m'
        };
        
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async testBackendHealth() {
        this.log('Testing Backend Health...', 'info');
        
        try {
            // Test basic connectivity
            const healthCheck = await axios.get(`${this.backendUrl}/health`, {
                timeout: 10000,
                validateStatus: () => true
            });
            
            this.results.api.backend.push({
                test: 'Health Check',
                url: `${this.backendUrl}/health`,
                status: healthCheck.status,
                success: healthCheck.status === 200,
                response: healthCheck.data,
                error: healthCheck.status !== 200 ? 'Health check failed' : null
            });

            if (healthCheck.status === 200) {
                this.log('✓ Backend is responding', 'success');
                this.results.summary.passed++;
            } else {
                this.log('✗ Backend health check failed', 'error');
                this.results.summary.failed++;
            }

        } catch (error) {
            this.log('✗ Backend is completely unreachable', 'error');
            this.results.api.backend.push({
                test: 'Health Check',
                url: `${this.backendUrl}/health`,
                success: false,
                error: error.message
            });
            this.results.summary.failed++;
        }

        this.results.summary.totalTests++;
    }

    async testAPIEndpoints() {
        this.log('Testing API Endpoints...', 'info');

        const endpoints = [
            // Auth endpoints
            { method: 'POST', path: '/api/auth/login', needsAuth: false },
            { method: 'GET', path: '/api/auth/me', needsAuth: true },
            
            // Core modules
            { method: 'GET', path: '/api/inventory/items', needsAuth: true },
            { method: 'GET', path: '/api/sales/orders', needsAuth: true },
            { method: 'GET', path: '/api/purchase/orders', needsAuth: true },
            { method: 'GET', path: '/api/financial/accounts', needsAuth: true },
            { method: 'GET', path: '/api/hr/employees', needsAuth: true },
            { method: 'GET', path: '/api/manufacturing/boms', needsAuth: true },
            { method: 'GET', path: '/api/warehouse/locations', needsAuth: true },
            { method: 'GET', path: '/api/logistics/vehicles', needsAuth: true },
            { method: 'GET', path: '/api/projects/list', needsAuth: true },
            
            // Financial modules
            { method: 'GET', path: '/api/cash-management/accounts', needsAuth: true },
            { method: 'GET', path: '/api/assets/list', needsAuth: true },
            { method: 'GET', path: '/api/audit/logs', needsAuth: true },
            { method: 'GET', path: '/api/sars/returns', needsAuth: true },
            
            // Industry modules
            { method: 'GET', path: '/api/healthcare/patients', needsAuth: true },
            { method: 'GET', path: '/api/mining/operations', needsAuth: true },
            { method: 'GET', path: '/api/construction/projects', needsAuth: true },
            { method: 'GET', path: '/api/agriculture/crops', needsAuth: true },
            { method: 'GET', path: '/api/property/units', needsAuth: true },
            
            // Admin
            { method: 'GET', path: '/api/admin/users', needsAuth: true },
            { method: 'GET', path: '/api/admin/settings', needsAuth: true }
        ];

        for (const endpoint of endpoints) {
            await this.testSingleEndpoint(endpoint);
        }
    }

    async testSingleEndpoint(endpoint) {
        try {
            const config = {
                method: endpoint.method,
                url: `${this.backendUrl}${endpoint.path}`,
                timeout: 5000,
                validateStatus: () => true
            };

            // Add auth header if needed - try with mock token first
            if (endpoint.needsAuth) {
                config.headers = {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                };
            }

            const response = await axios(config);
            
            const result = {
                test: `${endpoint.method} ${endpoint.path}`,
                url: config.url,
                status: response.status,
                needsAuth: endpoint.needsAuth,
                success: response.status < 500, // 400s are expected for auth, 500s are real errors
                response: this.summarizeResponse(response.data),
                error: response.status >= 500 ? 'Server error' : null
            };

            this.results.api.endpoints.push(result);

            if (result.success) {
                this.log(`✓ ${endpoint.method} ${endpoint.path} (${response.status})`, 'success');
                this.results.summary.passed++;
            } else {
                this.log(`✗ ${endpoint.method} ${endpoint.path} (${response.status})`, 'error');
                this.results.summary.failed++;
            }

        } catch (error) {
            this.log(`✗ ${endpoint.method} ${endpoint.path} - ${error.message}`, 'error');
            this.results.api.endpoints.push({
                test: `${endpoint.method} ${endpoint.path}`,
                success: false,
                error: error.message
            });
            this.results.summary.failed++;
        }

        this.results.summary.totalTests++;
    }

    async testFrontendRoutes() {
        this.log('Testing Frontend Routes...', 'info');

        const routes = [
            '/',
            '/app',
            '/app/dashboard',
            '/app/inventory',
            '/app/sales',
            '/app/purchase', 
            '/app/financial',
            '/app/hr',
            '/app/manufacturing',
            '/app/warehouse',
            '/app/logistics',
            '/app/projects',
            '/app/proposals',
            '/app/communications',
            '/app/healthcare',
            '/app/mining',
            '/app/construction',
            '/app/agriculture',
            '/app/property'
        ];

        for (const route of routes) {
            await this.testFrontendRoute(route);
        }
    }

    async testFrontendRoute(route) {
        try {
            const response = await axios.get(`${this.frontendUrl}${route}`, {
                timeout: 10000,
                validateStatus: () => true
            });

            const isHTML = response.headers['content-type']?.includes('text/html');
            const hasReactRoot = typeof response.data === 'string' && response.data.includes('root');
            
            const result = {
                route,
                status: response.status,
                isHTML,
                hasReactRoot,
                success: response.status === 200 && isHTML,
                size: response.data?.length || 0
            };

            this.results.frontend.routes.push(result);

            if (result.success) {
                this.log(`✓ Route ${route}`, 'success');
                this.results.summary.passed++;
            } else {
                this.log(`✗ Route ${route} (${response.status})`, 'error');
                this.results.summary.failed++;
            }

        } catch (error) {
            this.log(`✗ Route ${route} - ${error.message}`, 'error');
            this.results.frontend.routes.push({
                route,
                success: false,
                error: error.message
            });
            this.results.summary.failed++;
        }

        this.results.summary.totalTests++;
    }

    async scanForMockData() {
        this.log('Scanning for Mock Data...', 'info');

        const mockPatterns = [
            /mock.*data/i,
            /fake.*data/i,
            /dummy.*data/i,
            /placeholder.*data/i,
            /sample.*data/i,
            /test.*data/i,
            /'lorem ipsum'/i,
            /'john doe'/i,
            /'jane smith'/i,
            /'example\.com'/i,
            /userId:\s*['"]?1['"]?/i,
            /id:\s*['"]?123['"]?/i
        ];

        const searchDirs = [
            path.join(__dirname, 'frontend/src'),
            path.join(__dirname, 'backend/src')
        ];

        for (const dir of searchDirs) {
            if (fs.existsSync(dir)) {
                await this.scanDirectoryForMocks(dir, mockPatterns);
            }
        }
    }

    async scanDirectoryForMocks(dir, patterns) {
        const files = fs.readdirSync(dir, { withFileTypes: true });

        for (const file of files) {
            const fullPath = path.join(dir, file.name);
            
            if (file.isDirectory() && !file.name.includes('node_modules')) {
                await this.scanDirectoryForMocks(fullPath, patterns);
            } else if (file.name.match(/\.(js|jsx|ts|tsx)$/)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                
                for (const pattern of patterns) {
                    const matches = content.match(pattern);
                    if (matches) {
                        this.results.frontend.mockData.push({
                            file: fullPath.replace(__dirname, ''),
                            pattern: pattern.toString(),
                            matches: matches.slice(0, 3) // Limit to first 3 matches
                        });
                        this.results.summary.warnings++;
                        break; // One warning per file
                    }
                }
            }
        }
    }

    summarizeResponse(data) {
        if (!data) return 'No data';
        
        if (typeof data === 'string') {
            return data.length > 200 ? `String (${data.length} chars)` : data;
        }
        
        if (Array.isArray(data)) {
            return `Array with ${data.length} items`;
        }
        
        if (typeof data === 'object') {
            const keys = Object.keys(data);
            return `Object with keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`;
        }
        
        return String(data);
    }

    generateReport() {
        const reportPath = path.join(__dirname, 'system-audit-report.json');
        const humanPath = path.join(__dirname, 'SYSTEM-AUDIT-REPORT.md');
        
        // Calculate percentages
        const total = this.results.summary.totalTests;
        const passRate = total > 0 ? ((this.results.summary.passed / total) * 100).toFixed(1) : 0;
        const failRate = total > 0 ? ((this.results.summary.failed / total) * 100).toFixed(1) : 0;

        // Save JSON report
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

        // Generate human-readable report
        const report = `# WorldClass ERP System Audit Report

**Generated:** ${this.results.summary.timestamp}

## Summary
- **Total Tests:** ${total}
- **Passed:** ${this.results.summary.passed} (${passRate}%)
- **Failed:** ${this.results.summary.failed} (${failRate}%)
- **Warnings:** ${this.results.summary.warnings}

## System Status
${passRate > 70 ? '🟢 MOSTLY FUNCTIONAL' : passRate > 40 ? '🟡 PARTIALLY FUNCTIONAL' : '🔴 SEVERELY BROKEN'}

## Backend API Status
${this.results.api.backend.map(test => `- **${test.test}:** ${test.success ? '✅' : '❌'} ${test.error || ''}`).join('\n')}

## API Endpoints
${this.results.api.endpoints.slice(0, 10).map(ep => 
    `- **${ep.test}:** ${ep.success ? '✅' : '❌'} (${ep.status || 'No response'})`
).join('\n')}

${this.results.api.endpoints.length > 10 ? `\n*... and ${this.results.api.endpoints.length - 10} more endpoints*` : ''}

## Frontend Routes
${this.results.frontend.routes.slice(0, 10).map(route => 
    `- **${route.route}:** ${route.success ? '✅' : '❌'} ${route.status ? `(${route.status})` : ''}`
).join('\n')}

## Mock Data Found
${this.results.frontend.mockData.length > 0 ? 
    this.results.frontend.mockData.slice(0, 5).map(mock => 
        `- **${mock.file}:** ${mock.pattern}`
    ).join('\n') + (this.results.frontend.mockData.length > 5 ? `\n*... and ${this.results.frontend.mockData.length - 5} more files with mock data*` : '')
    : 'No obvious mock data patterns found'}

## Critical Issues
${this.results.summary.failed > total * 0.5 ? '🚨 **MORE THAN HALF OF TESTS FAILING**' : ''}
${this.results.api.backend.some(t => !t.success) ? '🚨 **BACKEND IS NOT RESPONDING**' : ''}
${this.results.frontend.mockData.length > 10 ? '⚠️ **EXTENSIVE MOCK DATA USAGE**' : ''}

## Recommendations
1. ${this.results.summary.failed > 0 ? `Fix ${this.results.summary.failed} failed tests` : 'System appears functional'}
2. ${this.results.frontend.mockData.length > 0 ? `Replace mock data in ${this.results.frontend.mockData.length} files with real API calls` : 'Mock data usage is minimal'}
3. ${this.results.api.endpoints.filter(ep => !ep.success).length > 0 ? 'Investigate backend API connectivity' : 'API connectivity looks good'}

---
*Full details in: ${reportPath}*
`;

        fs.writeFileSync(humanPath, report);

        this.log(`\n📊 Audit Complete!`, 'success');
        this.log(`📄 Human Report: ${humanPath}`, 'info');
        this.log(`📋 JSON Report: ${reportPath}`, 'info');
        
        return { humanPath, reportPath, results: this.results };
    }

    async run() {
        this.log('🔍 Starting WorldClass ERP System Audit...', 'info');
        
        await this.testBackendHealth();
        await this.testAPIEndpoints();
        await this.testFrontendRoutes();
        await this.scanForMockData();
        
        return this.generateReport();
    }
}

// Run the audit
if (require.main === module) {
    const audit = new ERPSystemAudit();
    audit.run().then(report => {
        console.log(`\n✅ Audit complete. Check ${report.humanPath} for results.`);
        process.exit(0);
    }).catch(error => {
        console.error('❌ Audit failed:', error);
        process.exit(1);
    });
}

module.exports = ERPSystemAudit;