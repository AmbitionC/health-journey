import React, { useState } from 'react';
import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Form,
  InputNumber,
  Input,
  List,
  Popconfirm,
  Segmented,
  Skeleton,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import Guard from '@/components/Guard';
import { useFetch } from '@/hooks/useFetch';
import { api, BodyRecord } from '@/api/health';

const METRICS: Array<{
  key: keyof BodyRecord;
  label: string;
  unit: string;
  color: string;
  goalLines?: number[];
}> = [
  { key: 'weightKg', label: '体重', unit: 'kg', color: '#10b981', goalLines: [85, 80, 76] },
  { key: 'bodyFatPct', label: '体脂率', unit: '%', color: '#f59e0b', goalLines: [20] },
  { key: 'visceralFatLevel', label: '内脏脂肪', unit: '级', color: '#ef4444', goalLines: [10] },
  { key: 'muscleMassKg', label: '肌肉量', unit: 'kg', color: '#3b82f6', goalLines: [60] },
  { key: 'waterPct', label: '水分率', unit: '%', color: '#06b6d4', goalLines: [55] },
];

function BodyContent() {
  const { data, loading, error, reload } = useFetch(() => api.bodyTrend(730));
  const [metricLabel, setMetricLabel] = useState('体重');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (error)
    return (
      <Alert type="error" message="加载失败" description={error} action={<Button onClick={reload}>重试</Button>} />
    );
  const records = data || [];
  const metric = METRICS.find(m => m.label === metricLabel)!;
  const points = records.filter(r => r[metric.key] != null);

  const chartOption = {
    grid: { left: 42, right: 12, top: 14, bottom: 24 },
    xAxis: {
      type: 'category',
      data: points.map(r => dayjs(r.date).format('M/D')),
      axisLabel: { fontSize: 10, color: '#8d9992' },
      axisLine: { lineStyle: { color: '#eceeed' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: { fontSize: 10, color: '#8d9992' },
      splitLine: { lineStyle: { color: '#f0f3f1' } },
    },
    series: [
      {
        type: 'line',
        data: points.map(r => r[metric.key]),
        smooth: true,
        symbolSize: 6,
        lineStyle: { color: metric.color, width: 2.5 },
        itemStyle: { color: metric.color },
        markLine: metric.goalLines
          ? {
              silent: true,
              symbol: 'none',
              data: metric.goalLines.map(v => ({ yAxis: v })),
              lineStyle: { color: '#c3cec8', type: 'dashed' },
              label: { fontSize: 10, color: '#8d9992' },
            }
          : undefined,
      },
    ],
    tooltip: { trigger: 'axis' },
  };

  const submit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await api.bodyUpsert({
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      });
      message.success('已保存');
      setDrawerOpen(false);
      form.resetFields();
      reload();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="hj-page-title">
        身体数据
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          style={{ float: 'right' }}
          onClick={() => {
            form.setFieldsValue({ date: dayjs() });
            setDrawerOpen(true);
          }}
        >
          记录
        </Button>
      </div>

      <div className="hj-card">
        <Segmented
          block
          options={METRICS.map(m => m.label)}
          value={metricLabel}
          onChange={v => setMetricLabel(v as string)}
          size="small"
        />
        <div style={{ marginTop: 12 }}>
          {points.length > 1 ? (
            <ReactECharts option={chartOption} style={{ height: 220 }} notMerge />
          ) : (
            <div className="hj-sub" style={{ padding: '30px 0', textAlign: 'center' }}>
              该指标记录不足 2 条，暂无趋势
            </div>
          )}
        </div>
      </div>

      <div className="hj-card">
        <div className="hj-card-title">历史记录</div>
        <List
          dataSource={[...records].reverse()}
          renderItem={r => (
            <List.Item
              style={{ padding: '10px 0' }}
              actions={[
                <Popconfirm
                  key="del"
                  title="删除这条记录？"
                  onConfirm={async () => {
                    await api.bodyDelete(r.date);
                    message.success('已删除');
                    reload();
                  }}
                >
                  <a style={{ color: '#c3cec8', fontSize: 12 }}>删除</a>
                </Popconfirm>,
              ]}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1c2b25' }}>
                  {r.weightKg} kg
                  {r.bodyFatPct != null && (
                    <span style={{ fontWeight: 400, color: '#8d9992', fontSize: 12, marginLeft: 8 }}>
                      体脂 {r.bodyFatPct}% · 内脏 {r.visceralFatLevel ?? '--'} · 肌肉{' '}
                      {r.muscleMassKg ?? '--'}kg
                    </span>
                  )}
                </div>
                <div className="hj-sub">{dayjs(r.date).format('YYYY年M月D日')}{r.notes ? ` · ${r.notes}` : ''}</div>
              </div>
            </List.Item>
          )}
        />
      </div>

      <Drawer
        title="记录体重 / 体成分"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="bottom"
        height="82%"
        extra={
          <Button type="primary" loading={saving} onClick={submit}>
            保存
          </Button>
        }
      >
        <Form form={form} layout="vertical" size="middle">
          <Form.Item name="date" label="日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="weightKg" label="体重 (kg)" rules={[{ required: true, message: '请填写体重' }]}>
            <InputNumber style={{ width: '100%' }} min={30} max={200} step={0.05} inputMode="decimal" />
          </Form.Item>
          <div className="hj-sub" style={{ marginBottom: 12 }}>
            以下为可选项（体脂秤有数据时填写；BMI 留空自动计算）
          </div>
          <div className="hj-grid-2">
            <Form.Item name="bodyFatPct" label="体脂率 (%)">
              <InputNumber style={{ width: '100%' }} min={3} max={60} step={0.1} inputMode="decimal" />
            </Form.Item>
            <Form.Item name="visceralFatLevel" label="内脏脂肪等级">
              <InputNumber style={{ width: '100%' }} min={1} max={40} step={0.5} inputMode="decimal" />
            </Form.Item>
            <Form.Item name="muscleMassKg" label="肌肉量 (kg)">
              <InputNumber style={{ width: '100%' }} min={20} max={100} step={0.1} inputMode="decimal" />
            </Form.Item>
            <Form.Item name="skeletalMuscleMassKg" label="骨骼肌 (kg)">
              <InputNumber style={{ width: '100%' }} min={10} max={60} step={0.1} inputMode="decimal" />
            </Form.Item>
            <Form.Item name="bodyFatMassKg" label="体脂量 (kg)">
              <InputNumber style={{ width: '100%' }} min={1} max={80} step={0.1} inputMode="decimal" />
            </Form.Item>
            <Form.Item name="subcutaneousFatPct" label="皮下脂肪率 (%)">
              <InputNumber style={{ width: '100%' }} min={3} max={50} step={0.1} inputMode="decimal" />
            </Form.Item>
            <Form.Item name="proteinPct" label="蛋白率 (%)">
              <InputNumber style={{ width: '100%' }} min={5} max={30} step={0.1} inputMode="decimal" />
            </Form.Item>
            <Form.Item name="waterPct" label="水分率 (%)">
              <InputNumber style={{ width: '100%' }} min={30} max={80} step={0.1} inputMode="decimal" />
            </Form.Item>
          </div>
          <Form.Item name="notes" label="备注">
            <Input placeholder="如：晨起空腹" />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}

export default function BodyPage() {
  return (
    <Guard>
      <BodyContent />
    </Guard>
  );
}
