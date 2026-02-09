import React, { useState } from 'react';
import './App.css';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const visitorData = [
    { month: 'Jan', loyal: 20, new: 35, unique: 45 },
    { month: 'Feb', loyal: 35, new: 25, unique: 35 },
    { month: 'Mar', loyal: 30, new: 40, unique: 50 },
    { month: 'Apr', loyal: 45, new: 30, unique: 40 },
    { month: 'May', loyal: 40, new: 50, unique: 60 },
    { month: 'Jun', loyal: 55, new: 45, unique: 55 },
  ];

  const revenueData = [
    { day: 'Mon', online: 15, offline: 12 },
    { day: 'Tue', online: 18, offline: 10 },
    { day: 'Wed', online: 10, offline: 22 },
    { day: 'Thu', online: 17, offline: 11 },
    { day: 'Fri', online: 12, offline: 13 },
    { day: 'Sat', online: 14, offline: 16 },
    { day: 'Sun', online: 21, offline: 11 },
  ];

  const pieData = [
    { name: 'Direct', value: 400, color: '#0095FF' },
    { name: 'Social', value: 300, color: '#00E096' },
    { name: 'Email', value: 300, color: '#8884d8' },
    { name: 'Ads', value: 200, color: '#FFCF00' },
  ];

  const satisfactionData = [
    { name: 'Week 1', value: 40 },
    { name: 'Week 2', value: 70 },
    { name: 'Week 3', value: 50 },
    { name: 'Week 4', value: 90 },
  ];

  const customersData = [
    { name: "Jane Cooper", company: "Microsoft", phone: "(225) 555-0118", email: "jane@microsoft.com", country: "United States", status: "Active" },
    { name: "Floyd Miles", company: "Yahoo", phone: "(205) 555-0100", email: "floyd@yahoo.com", country: "Kiribati", status: "Inactive" },
    { name: "Ronald Richards", company: "Adobe", phone: "(302) 555-0107", email: "ronald@adobe.com", country: "Israel", status: "Inactive" },
    { name: "Marvin McKinney", company: "Tesla", phone: "(252) 555-0126", email: "marvin@tesla.com", country: "Iran", status: "Active" },
    { name: "Jerome Bell", company: "Google", phone: "(629) 555-0129", email: "jerome@google.com", country: "Réunion", status: "Active" },
    { name: "Kathryn Murphy", company: "Microsoft", phone: "(406) 555-0120", email: "kathryn@microsoft.com", country: "Curaçao", status: "Active" },
    { name: "Jacob Jones", company: "Yahoo", phone: "(208) 555-0112", email: "jacob@yahoo.com", country: "Brazil", status: "Active" },
    { name: "Kristin Watson", company: "Facebook", phone: "(704) 555-0127", email: "kristin@facebook.com", country: "Åland Islands", status: "Inactive" },
  ];

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'Dashboard' ? (
        <Dashboard 
          visitorData={visitorData} 
          revenueData={revenueData} 
          pieData={pieData} 
          satisfactionData={satisfactionData} 
        />
      ) : activeTab === 'Customers' ? (
        <Customers customers={customersData} />
      ) : (
        <div style={{ padding: '20px' }}>Content for {activeTab} coming soon...</div>
      )}
    </Layout>
  );
}

export default App;