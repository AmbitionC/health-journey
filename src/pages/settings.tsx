import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Select,
  Skeleton,
  message,
} from 'antd';
import { ApiOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { getApiBase, getToken, isConfigured, saveConfig } from '@/api/client';
import { api, DailyBudget, HealthProfile } from '@/api/health';

export default function SettingsPage() {
  const [connForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [budget, setBudget] = useState<DailyBudget | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const loadProfile = async () => {
    if (!isConfigured()) return;
    setLoadingProfile(true);
    try {
      const [p, b] = await Promise.all([api.profile(), api.budget()]);
      setProfile(p);
      setBudget(b);
      profileForm.setFieldsValue(p);
      setConnected(true);
    } catch {
      /* 连接失败时保持未连接状态 */
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    connForm.setFieldsValue({ base: getApiBase(), token: getToken() });
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const testAndSave = async () => {
    const { base, token } = await connForm.validateFields();
    setTesting(true);
    try {
      saveConfig(base, token);
      await api.ping();
      setConnected(true);
      message.success('连接成功，配置已保存');
      loadProfile();
    } catch (e: any) {
      setConnected(false);
      message.error(`连接失败：${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const saveProfile = async () => {
    const values = await profileForm.validateFields();
    setSavingProfile(true);
    try {
      const p = await api.profileUpdate(values);
      setProfile(p);
      setBudget(await api.budget());
      message.success('已保存，预算已重新计算');
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <>
      <div className="hj-page-title">设置</div>

      {/* 连接配置 */}
      <div className="hj-card">
        <div className="hj-card-title">
          <span>
            <ApiOutlined style={{ marginRight: 6 }} />
            后端连接
          </span>
          {connected && (
            <span style={{ color: '#10b981', fontSize: 12 }}>
              <CheckCircleOutlined /> 已连接
            </span>
          )}
        </div>
        <Form form={connForm} layout="vertical">
          <Form.Item
            name="base"
            label="API 地址"
            rules={[{ required: true, message: '请填写 FC 函数地址' }]}
            extra="阿里云 FC 函数公网地址，如 https://fe-journey-main-xxx.cn-hangzhou.fcapp.run"
          >
            <Input placeholder="https://…fcapp.run" />
          </Form.Item>
          <Form.Item
            name="token"
            label="访问令牌"
            rules={[{ required: true, message: '请填写 HEALTH_API_TOKEN' }]}
            extra="与后端环境变量 HEALTH_API_TOKEN 一致（存储在本机浏览器）"
          >
            <Input.Password placeholder="X-Health-Token" />
          </Form.Item>
          <Button type="primary" block loading={testing} onClick={testAndSave}>
            测试并保存
          </Button>
        </Form>
      </div>

      {/* 预算说明 */}
      {budget && (
        <div className="hj-card">
          <div className="hj-card-title">当前每日预算（自动计算）</div>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="摄入目标">{budget.intakeKcal} kcal</Descriptions.Item>
            <Descriptions.Item label="蛋白质">
              {budget.proteinG} g（{budget.proteinRange[0]}–{budget.proteinRange[1]}）
            </Descriptions.Item>
            <Descriptions.Item label="碳水">{budget.carbsG} g</Descriptions.Item>
            <Descriptions.Item label="脂肪">{budget.fatG} g</Descriptions.Item>
            <Descriptions.Item label="BMR">
              {budget.basis.bmr} kcal
            </Descriptions.Item>
            <Descriptions.Item label="TDEE">
              {budget.basis.tdee} kcal（
              {budget.basis.tdeeSource === 'measured'
                ? `Watch 实测 ${budget.basis.tdeeMeasuredDays} 天均值`
                : `系数 ${budget.basis.activityFactor} 估算`}
              ）
            </Descriptions.Item>
          </Descriptions>
          <div className="hj-sub" style={{ marginTop: 8 }}>
            预算 = TDEE − 缺口 {budget.basis.deficitKcal} kcal。同步 Apple Watch
            实测消耗 ≥3 天后自动升级为实测口径。
          </div>
        </div>
      )}

      {/* 个人档案 */}
      <div className="hj-card">
        <div className="hj-card-title">个人档案与减脂参数</div>
        {loadingProfile ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : profile ? (
          <Form form={profileForm} layout="vertical">
            <div className="hj-grid-2">
              <Form.Item name="heightCm" label="身高 (cm)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={100} max={230} step={0.1} />
              </Form.Item>
              <Form.Item name="birthYear" label="出生年份" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={1930} max={2020} />
              </Form.Item>
              <Form.Item name="sex" label="性别">
                <Select
                  options={[
                    { value: 'male', label: '男' },
                    { value: 'female', label: '女' },
                  ]}
                />
              </Form.Item>
              <Form.Item name="goalWeightKg" label="目标体重 (kg)">
                <InputNumber style={{ width: '100%' }} min={40} max={150} step={0.5} />
              </Form.Item>
              <Form.Item
                name="activityFactor"
                label="活动系数"
                extra="久坐 1.2 / 轻度 1.375 / 中度 1.55"
              >
                <InputNumber style={{ width: '100%' }} min={1.1} max={2} step={0.05} />
              </Form.Item>
              <Form.Item name="deficitKcal" label="每日热量缺口 (kcal)" extra="建议 300–500">
                <InputNumber style={{ width: '100%' }} min={0} max={1000} step={50} />
              </Form.Item>
              <Form.Item name="proteinPerKg" label="蛋白系数 (g/kg)" extra="减脂期建议 1.6–2.0">
                <InputNumber style={{ width: '100%' }} min={0.8} max={3} step={0.1} />
              </Form.Item>
            </div>
            <Form.Item
              name="preferences"
              label="饮食偏好 / 忌口"
              extra="会用于 AI 建议与拍照识别提示"
            >
              <Input.TextArea rows={2} placeholder="如：不吃香菜；午餐通常是外卖；晚上可自炊" />
            </Form.Item>
            <Button type="primary" block loading={savingProfile} onClick={saveProfile}>
              保存档案
            </Button>
          </Form>
        ) : (
          <Alert type="info" message="先完成上方连接配置" showIcon />
        )}
      </div>

      {/* 目标 */}
      {profile && profile.goals.length > 0 && (
        <div className="hj-card">
          <div className="hj-card-title">阶段目标</div>
          {profile.goals.map((g, i) => (
            <div key={i} style={{ padding: '6px 0', fontSize: 13, color: '#3c4a44' }}>
              <b style={{ color: '#10b981' }}>{g.horizon}</b> · {g.target}
            </div>
          ))}
          <div className="hj-sub">目标调整请在 health 仓库 context/goals.md 修订后同步</div>
        </div>
      )}

      <div className="hj-sub" style={{ textAlign: 'center', margin: '20px 0' }}>
        Health Journey · 数据存储于私有 health 库
      </div>
    </>
  );
}
