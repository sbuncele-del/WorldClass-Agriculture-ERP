import { useState } from 'react';
import {
  ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, CloudSun,
  Droplets, Gauge, Grid2X2, Leaf, Map, MoreHorizontal, Package,
  Search, Settings, Sprout, Tractor, TrendingUp, Users, WalletCards,
  Wheat, Wrench, X
} from 'lucide-react';
import './AgricultureCommandCentre.css';

type WorkItem = {
  id: number;
  level: 'Critical' | 'Due today' | 'Opportunity' | 'Attention';
  title: string;
  meta: string;
  detail: string;
  action: string;
  time: string;
  truth: 'Measured' | 'Calculated' | 'Forecast';
};

const workItems: WorkItem[] = [
  { id: 1, level: 'Critical', title: 'Irrigation pressure below target', meta: 'North Pivot · Block A3', detail: 'Pressure has remained 18% below target for 46 minutes. Maize stress risk increases after 14:00.', action: 'Dispatch technician', time: 'Now', truth: 'Measured' },
  { id: 2, level: 'Due today', title: 'Approve seasonal labour run', meta: 'Payroll · 42 workers', detail: 'Timesheets are complete. Two exceptions need manager confirmation before the 12:00 cut-off.', action: 'Review payroll', time: '10:30', truth: 'Calculated' },
  { id: 3, level: 'Opportunity', title: 'Harvest Block C2 early', meta: 'Soybean · 34.2 ha', detail: 'Moisture and buyer pricing indicate a R186k margin improvement if harvesting begins tomorrow.', action: 'Review recommendation', time: 'Today', truth: 'Forecast' },
  { id: 4, level: 'Attention', title: 'Diesel stock approaching reserve', meta: 'FleetSA · Main depot · 2,840 L', detail: 'Current burn rate leaves 3.4 operating days. Supplier lead time is two days.', action: 'Create purchase request', time: '2 days', truth: 'Calculated' },
];

const fields = [
  { name: 'Block A3', crop: 'Yellow maize', hectares: '48.6 ha', stage: 'Vegetative', health: 82, tone: 'good' },
  { name: 'Block B1', crop: 'Yellow maize', hectares: '61.4 ha', stage: 'Tasseling', health: 94, tone: 'great' },
  { name: 'Block C2', crop: 'Soybean', hectares: '34.2 ha', stage: 'Harvest ready', health: 88, tone: 'gold' },
];

const navigation = [
  ['Command Centre', Grid2X2], ['Farm Map', Map], ['Production', Sprout],
  ['Livestock', Wheat], ['Equipment', Tractor], ['Inventory', Package],
  ['People & Payroll', Users], ['Financial Control', WalletCards],
] as const;

export default function AgricultureCommandCentre() {
  const [active, setActive] = useState('Command Centre');
  const [selected, setSelected] = useState<WorkItem | null>(workItems[0]);
  const [completed, setCompleted] = useState<number[]>([]);

  const complete = (id: number) => {
    setCompleted((current) => current.includes(id) ? current : [...current, id]);
    setSelected(null);
  };

  return (
    <div className="ag-os">
      <aside className="ag-sidebar">
        <div className="ag-brand"><div className="ag-brand-mark"><Leaf size={21}/></div><div><strong>MASAPHOKATI</strong><span>AGRICULTURE OS</span></div></div>
        <button className="ag-farm-switcher"><span className="ag-farm-icon">MV</span><span><strong>Mavuso Valley</strong><small>Mpumalanga · 286 ha</small></span><ChevronDown size={15}/></button>
        <nav>
          <p className="ag-nav-label">OPERATIONS</p>
          {navigation.map(([label, Icon]) => <button key={label} className={active === label ? 'ag-nav-item is-active' : 'ag-nav-item'} onClick={() => setActive(label)}><Icon size={18}/><span>{label}</span>{label === 'Equipment' && <b>2</b>}</button>)}
          <p className="ag-nav-label ag-second">MANAGEMENT</p>
          <button className="ag-nav-item"><Gauge size={18}/><span>Reports & Intelligence</span></button>
          <button className="ag-nav-item"><Settings size={18}/><span>Farm Settings</span></button>
        </nav>
        <div className="ag-season"><span>CURRENT SEASON</span><strong>2026/27 Summer</strong><div><i/></div><p><span>Day 98 of 184</span><b>53%</b></p></div>
      </aside>

      <section className="ag-workspace">
        <header className="ag-topbar">
          <div className="ag-mobile-brand"><Leaf size={20}/> Agriculture OS</div>
          <label className="ag-search"><Search size={17}/><input aria-label="Search agriculture records" placeholder="Search anything on the farm…"/><kbd>⌘ K</kbd></label>
          <div className="ag-top-actions"><div className="ag-weather"><CloudSun size={20}/><span><strong>24°C</strong><small>SenseIT station · 2 min ago</small></span></div><button className="ag-icon-button" aria-label="Notifications"><Bell size={19}/><i/></button><div className="ag-avatar">SM</div></div>
        </header>

        <div className="ag-content">
          <header className="ag-page-heading"><div><p>FRIDAY, 29 AUGUST</p><h1>Good morning, Sibusiso.</h1><span>Here is what needs your attention across Mavuso Valley today.</span></div><div className="ag-heading-actions"><button><CalendarDays size={16}/> 29 Aug 2026</button><button className="primary">Record farm activity <ArrowUpRight size={16}/></button></div></header>

          <section className="ag-intelligence"><div className="ag-intelligence-title"><span><TrendingUp size={17}/></span><div><p>MASAPHOKATI INTELLIGENCE</p><strong>Today’s operating brief</strong></div></div><div className="ag-intelligence-copy">Protect <b>Block A3 irrigation</b> before 14:00, then release payroll. Bringing the C2 harvest forward could improve margin by <b>R186,000.</b></div><button>Open brief <ArrowUpRight size={15}/></button></section>

          <section className="ag-metrics">
            <article><div><span className="green"><Sprout size={18}/></span><em>Calculated · +4.8%</em></div><p>Projected season revenue</p><h2>R 8.42m</h2><small>vs R8.03m plan</small></article>
            <article><div><span className="blue"><Droplets size={18}/></span><em>Measured · 4 min</em></div><p>Water allocation</p><h2>31.8 ML</h2><small>12.4 ML remaining</small></article>
            <article><div><span className="gold"><Wheat size={18}/></span><em>Calculated · On plan</em></div><p>Area in production</p><h2>246.7 ha</h2><small>86% of arable land</small></article>
            <article><div><span className="ink"><Tractor size={18}/></span><em className="warning">FleetSA · 2 alerts</em></div><p>Equipment readiness</p><h2>91%</h2><small>21 of 23 available</small></article>
          </section>

          <div className="ag-main-grid">
            <section className="ag-panel"><header><div><p>PRIORITISED WORK</p><h3>What needs to happen next</h3></div><button>View all work <ArrowUpRight size={15}/></button></header><div>
              {workItems.filter((item) => !completed.includes(item.id)).map((item) => <button key={item.id} className={selected?.id === item.id ? 'ag-work-row is-selected' : 'ag-work-row'} onClick={() => setSelected(item)}><span className={`ag-priority ${item.level.toLowerCase().replace(' ', '-')}`}/><span><em>{item.level} · {item.truth}</em><strong>{item.title}</strong><small>{item.meta}</small></span><time>{item.time}</time><ArrowUpRight size={16}/></button>)}
              {completed.length === workItems.length && <div className="ag-empty"><Check size={20}/><strong>Today’s priority queue is clear.</strong></div>}
            </div></section>

            <section className="ag-panel"><header><div><p>LAND & PRODUCTION</p><h3>Field performance</h3></div><button aria-label="More field actions"><MoreHorizontal size={18}/></button></header><div className="ag-field-summary"><div className="ag-radial"><span>89<small>/100</small></span></div><div><p>Average crop health</p><strong>Strong condition</strong><small>Calculated · 3 inputs · updated today</small></div></div><div>{fields.map((field) => <div className="ag-field-row" key={field.name}><i className={field.tone}/><span><strong>{field.name}</strong><small>{field.crop} · {field.hectares}</small></span><span className="ag-health"><small>{field.stage}</small><b>{field.health}%</b></span></div>)}</div><button className="ag-map-button"><Map size={16}/> Open live farm map</button></section>
          </div>

          <section className="ag-lower-grid">
            <article><header><span><Wrench size={17}/></span><div><p>EQUIPMENT</p><strong>Maintenance horizon</strong></div><b>2 due</b></header><div className="ag-equipment"><span><strong>JD 6155M Tractor</strong><small>Service due in 18 hours</small></span><i><b style={{width:'78%'}}/></i></div></article>
            <article><header><span><Package size={17}/></span><div><p>INPUTS</p><strong>Stock exposure</strong></div><b className="amber">R 284k</b></header><div className="ag-bars"><i><b style={{width:'84%'}}/></i><i><b style={{width:'61%'}}/></i><i><b style={{width:'37%'}}/></i></div><small>Seed 84% · Fertiliser 61% · Chemicals 37%</small></article>
            <article><header><span><WalletCards size={17}/></span><div><p>FARM ECONOMICS</p><strong>Gross margin outlook</strong></div><b className="positive">+7.2%</b></header><div className="ag-margin">R 3.18m <span>forecast</span></div><small>Siyabusa actuals · R12,887 per productive hectare</small></article>
          </section>
        </div>
      </section>

      {selected && <aside className="ag-drawer"><button className="ag-drawer-close" onClick={() => setSelected(null)} aria-label="Close"><X size={18}/></button><p>{selected.level} · {selected.truth}</p><h2>{selected.title}</h2><span>{selected.meta}</span><section><p>WHY THIS MATTERS</p><strong>{selected.detail}</strong></section><section><p>RECOMMENDED NEXT ACTION</p><button className="ag-drawer-primary" onClick={() => complete(selected.id)}>{selected.action}<ArrowUpRight size={16}/></button><button className="ag-drawer-secondary" onClick={() => complete(selected.id)}><Check size={16}/> Mark resolved</button></section><footer><strong>Evidence and action audit</strong><small>Source readings, decisions and resolution will be recorded against the affected farm object.</small></footer></aside>}
    </div>
  );
}
