import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'umi';
import { isConfigured } from '@/api/client';

/** 未配置 API 地址/token 时引导去设置页；已配置则渲染页面内容。 */
export default function Guard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  if (!isConfigured()) {
    return (
      <Result
        status="info"
        title="先完成连接配置"
        subTitle="填写后端 API 地址与访问令牌后即可使用"
        extra={
          <Button type="primary" onClick={() => navigate('/settings')}>
            去设置
          </Button>
        }
      />
    );
  }
  return <>{children}</>;
}
