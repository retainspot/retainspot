import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';

const Dashboard = ({ visitorData, revenueData, pieData, satisfactionData }) => {
  return (
    <div className="dashboard-content">
      <div className="dashboard-row-1">
        <div className="card sales-card">
          <div className="card-header">
            <h3>Today's Sales</h3>
            <button className="export-btn">📤 Export</button>
          </div>
          <div className="sales-stats-grid">
            {[
              { label: 'Total Sales', val: '$1k', bg: '#FFE2E5', icon: '📊', trend: '+8% from yesterday' },
              { label: 'Total Order', val: '300', bg: '#FFF4DE', icon: '📝', trend: '+5% from yesterday' },
              { label: 'Product Sold', val: '5', bg: '#DCFCE7', icon: '🏷️', trend: '+1.2% from yesterday' },
              { label: 'New Customers', val: '8', bg: '#F3E8FF', icon: '👤', trend: '0.5% from yesterday' },
            ].map((s, i) => (
              <div key={i} className="stat-box" style={{ backgroundColor: s.bg }}>
                <div className="stat-icon">{s.icon}</div>
                <h2>{s.val}</h2>
                <p className="stat-label">{s.label}</p>
                <p className="stat-trend">{s.trend}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card visitor-card">
          <h3>Visitor Insights</h3>
          <div className="chart-container-150">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visitorData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="month" hide />
                <YAxis hide />
                <Tooltip />
                <Line type="monotone" dataKey="loyal" stroke="#A700FF" strokeWidth={3} dot={false} animationDuration={1500} />
                <Line type="monotone" dataKey="new" stroke="#EF4444" strokeWidth={3} dot={false} animationDuration={1500} />
                <Line type="monotone" dataKey="unique" stroke="#3CD856" strokeWidth={3} dot={false} animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-row-2">
        <div className="card revenue-card">
          <h3>Total Revenue</h3>
          <div className="chart-container-120">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <XAxis dataKey="day" hide />
                <Tooltip />
                <Bar dataKey="online" fill="#0095FF" radius={[4, 4, 0, 0]} animationDuration={1000} />
                <Bar dataKey="offline" fill="#00E096" radius={[4, 4, 0, 0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card satisfaction-card">
          <h3>Customer Satisfaction</h3>
          <div className="chart-container-100">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={satisfactionData}>
                <defs>
                  <linearGradient id="colorSat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0095FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0095FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#0095FF" fillOpacity={1} fill="url(#colorSat)" animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card target-card">
          <h3>Target vs Reality</h3>
          <div className="chart-container-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <Bar dataKey="online" fill="#4AB58E" radius={[4, 4, 4, 4]} barSize={15} />
                <Bar dataKey="offline" fill="#FFCF00" radius={[4, 4, 4, 4]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dashboard-row-3">
        <div className="card products-card">
          <h3>Top Products</h3>
          <table className="products-mini-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Popularity</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: '01', name: 'Home Decor', color: '#0095FF', width: '45%' },
                { id: '02', name: 'Disney Princess', color: '#00E096', width: '29%' },
                { id: '03', name: 'Essentials', color: '#C5A8FF', width: '18%' },
              ].map((p, i) => (
                <tr key={i}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: p.width, backgroundColor: p.color }}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card source-card">
          <h3>Sales Source</h3>
          <div className="chart-container-source">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card volume-card">
          <h3 style={{paddingBottom:42}}>Volume vs Service</h3>
          <div className="chart-container-100">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData.slice(0, 5)}>
                <Bar dataKey="online" stackId="a" fill="#0095FF" />
                <Bar dataKey="offline" stackId="a" fill="#00E096" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;