import React from 'react';

const Customers = ({ customers }) => {
  return (
    <div className="customers-page">
      {/* STATS CARDS */}
      <div className="customers-stats-row">
        {[
          { label: 'Total Customers', val: '5,423', color: '#00AC4F', trend: '↑ 16%', icon: '👥', iconBg: '#D3FFE7' },
          { label: 'Members', val: '1,893', color: '#D0004B', trend: '↓ 1%', icon: '👤', iconBg: '#F3E8FF' },
          { label: 'Active Now', val: '189', color: null, icon: '💻', iconBg: '#E7E2FF' }
        ].map((item, idx) => (
          <div key={idx} className="customer-stat-card">
            <div className="stat-circle-icon" style={{ backgroundColor: item.iconBg }}>{item.icon}</div>
            <div className="stat-text-content">
              <p className="stat-label-gray">{item.label}</p>
              <h2 className="stat-value-large">{item.val}</h2>
              {item.trend ? (
                <span className="stat-trend-small" style={{ color: item.color }}>
                  {item.trend} <span style={{ color: '#292D32', fontWeight: 'normal' }}>this month</span>
                </span>
              ) : (
                <div className="avatar-stack">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="avatar-mini" style={{ backgroundImage: `url(https://i.pravatar.cc/150?u=${i})` }}></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* TABLE SECTION */}
      <div className="customers-table-container">
        <div className="table-header-flex">
          <div>
            <h2 className="table-main-title">All Customers</h2>
            <p className="table-sub-title">Active Members</p>
          </div>
          <div className="table-actions">
            <div className="table-search-box">
              <span className="search-icon-small">🔍</span>
              <input type="text" placeholder="Search" className="search-input-small" />
            </div>
            <div className="sort-box">
              Short by : <span className="sort-bold">Newest ⌵</span>
            </div>
          </div>
        </div>

        <table className="main-customers-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Company</th>
              <th>Phone Number</th>
              <th>Email</th>
              <th>Country</th>
              <th style={{ textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={i}>
                <td className="bold-cell">{c.name}</td>
                <td>{c.company}</td>
                <td>{c.phone}</td>
                <td>{c.email}</td>
                <td>{c.country}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`status-badge ${c.status.toLowerCase()}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* PAGINATION */}
        <div className="pagination-footer">
          <span>Showing data 1 to 8 of 256K entries</span>
          <div className="pagination-controls">
            <button className="page-nav-btn">&lt;</button>
            {[1, 2, 3, 4, '...', 40].map((p, i) => (
              <span key={i} className={`page-number ${p === 1 ? 'active' : ''}`}>{p}</span>
            ))}
            <button className="page-nav-btn">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;