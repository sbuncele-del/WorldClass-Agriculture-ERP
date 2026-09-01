import './styles.css';

export const metadata = { metadataBase:new URL('https://farm.siyabusaerp.co.za'), title:{default:'Masaphokati Agriculture OS',template:'%s | Masaphokati'}, description:'One governed operating system for modern agricultural enterprises.' };

export default function RootLayout({children}) { return <html lang="en"><body><Header/>{children}<Footer/></body></html> }

function Header(){return <header className="header"><a className="brand" href="/"><span className="mark">↟</span><span>MASAPHOKATI<small>AGRICULTURE OS</small></span></a><nav><a href="/agriculture-erp-platform">Platform</a><a href="/farm-operations-management">Operations</a><a href="/agricultural-business-intelligence">Intelligence</a><a href="/agricultural-finance-software">Finance</a></nav><a className="navCta" href="#demo">Book a demonstration</a></header>}
function Footer(){return <footer><div><span className="eyebrow">MASAPHOKATI AGRICULTURE OS</span><h2>The farm, under command.</h2></div><div className="footerLinks"><a href="/agriculture-erp-platform">Platform</a><a href="/farm-operations-management">Operations</a><a href="/agricultural-finance-software">Finance</a><a href="/agricultural-business-intelligence">Intelligence</a><a href="/sustainable-farm-management">Sustainability</a></div><p>Enterprise agriculture technology by Siyabusa ERP · South Africa</p></footer>}
