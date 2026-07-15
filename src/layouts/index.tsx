import React from 'react';
import { Outlet, useLocation, useNavigate } from 'umi';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import {
  HomeOutlined,
  LineChartOutlined,
  CoffeeOutlined,
  ThunderboltOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import './index.less';

dayjs.locale('zh-cn');

const TABS = [
  { key: '/', label: '今日', icon: <HomeOutlined /> },
  { key: '/body', label: '身体', icon: <LineChartOutlined /> },
  { key: '/meals', label: '饮食', icon: <CoffeeOutlined /> },
  { key: '/activity', label: '活动', icon: <ThunderboltOutlined /> },
  { key: '/settings', label: '设置', icon: <SettingOutlined /> },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#10b981',
          borderRadius: 10,
          colorBgLayout: '#f5f7f6',
        },
      }}
    >
      <AntApp>
        <div className="hj-shell">
          <main className="hj-main">
            <Outlet />
          </main>
          <nav className="hj-tabbar">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={
                  location.pathname === tab.key ? 'hj-tab active' : 'hj-tab'
                }
                onClick={() => navigate(tab.key)}
              >
                <span className="hj-tab-icon">{tab.icon}</span>
                <span className="hj-tab-label">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </AntApp>
    </ConfigProvider>
  );
}
