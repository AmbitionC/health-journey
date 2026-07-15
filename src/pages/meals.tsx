import React, { useRef, useState } from 'react';
import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Segmented,
  Select,
  Skeleton,
  Spin,
  Tag,
  TimePicker,
  message,
} from 'antd';
import { CameraOutlined, DeleteOutlined, LeftOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs, { Dayjs } from 'dayjs';
import Guard from '@/components/Guard';
import MacroBar from '@/components/MacroBar';
import { useFetch } from '@/hooks/useFetch';
import { api, MealItem } from '@/api/health';

const MEAL_LABEL: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};

/** 压缩图片到最长边 1024、JPEG 0.8，返回 dataURL（控制上传体积）。 */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const maxSide = 1024;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function emptyItem(): MealItem {
  return { name: '', portion: '', kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
}

function MealsContent() {
  const [date, setDate] = useState<Dayjs>(dayjs());
  const dateStr = date.format('YYYY-MM-DD');
  const { data, loading, error, reload } = useFetch(() => api.mealDay(dateStr), [dateStr]);
  const rangeQ = useFetch(
    () => api.mealRange(dayjs().subtract(29, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')),
    []
  );
  const budgetQ = useFetch(() => api.budget(), []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mode, setMode] = useState<'photo' | 'manual'>('photo');
  const [items, setItems] = useState<MealItem[]>([emptyItem()]);
  const [recognizing, setRecognizing] = useState(false);
  const [recognizeNote, setRecognizeNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const fileRef = useRef<HTMLInputElement>(null);

  const openDrawer = () => {
    const h = dayjs().hour();
    form.setFieldsValue({
      mealType: h < 10 ? 'breakfast' : h < 15 ? 'lunch' : h < 21 ? 'dinner' : 'snack',
      mealTime: dayjs(),
      notes: '',
    });
    setItems([emptyItem()]);
    setRecognizeNote('');
    setMode('photo');
    setDrawerOpen(true);
  };

  const onPickPhoto = async (file: File) => {
    setRecognizing(true);
    setRecognizeNote('');
    try {
      const dataUrl = await compressImage(file);
      const res = await api.mealRecognize(dataUrl);
      if (!res.available) {
        message.warning(res.notes || '视觉模型未配置，请手动录入');
        setMode('manual');
        return;
      }
      setItems(res.items.length ? res.items : [emptyItem()]);
      setRecognizeNote(
        `识别置信度 ${res.confidence || '中'}${res.notes ? ` · ${res.notes}` : ''}（可手动修正后保存）`
      );
    } catch (e: any) {
      message.error(`识别失败：${e.message}`);
    } finally {
      setRecognizing(false);
    }
  };

  const submit = async () => {
    const values = await form.validateFields();
    const validItems = items.filter(i => i.name.trim());
    if (!validItems.length) {
      message.warning('请至少填写一项食物');
      return;
    }
    setSaving(true);
    try {
      await api.mealAdd({
        date: dateStr,
        mealType: values.mealType,
        mealTime: values.mealTime ? values.mealTime.format('HH:mm') : undefined,
        source: mode === 'photo' && recognizeNote ? 'photo' : 'manual',
        items: validItems,
        notes: values.notes || undefined,
      });
      message.success('已记录');
      setDrawerOpen(false);
      reload();
      rangeQ.reload();
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const itemsTotal = items.reduce((s, i) => s + (Number(i.kcal) || 0), 0);

  const barOption = rangeQ.data
    ? {
        grid: { left: 40, right: 12, top: 14, bottom: 24 },
        xAxis: {
          type: 'category',
          data: rangeQ.data.map(d => dayjs(d.date).format('M/D')),
          axisLabel: { fontSize: 10, color: '#8d9992' },
          axisTick: { show: false },
          axisLine: { lineStyle: { color: '#eceeed' } },
        },
        yAxis: {
          type: 'value',
          axisLabel: { fontSize: 10, color: '#8d9992' },
          splitLine: { lineStyle: { color: '#f0f3f1' } },
        },
        series: [
          {
            type: 'bar',
            data: rangeQ.data.map(d => ({
              value: d.totalKcal,
              itemStyle: {
                color: d.totalKcal > d.budgetKcal ? '#f97316' : '#10b981',
                borderRadius: [4, 4, 0, 0],
              },
            })),
            barMaxWidth: 14,
            markLine: rangeQ.data.length
              ? {
                  silent: true,
                  symbol: 'none',
                  data: [{ yAxis: rangeQ.data[0].budgetKcal }],
                  lineStyle: { color: '#c3cec8', type: 'dashed' },
                  label: { formatter: '预算', fontSize: 10, color: '#8d9992' },
                }
              : undefined,
          },
        ],
        tooltip: { trigger: 'axis' },
      }
    : null;

  return (
    <>
      <div className="hj-page-title">
        饮食记录
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          style={{ float: 'right' }}
          onClick={openDrawer}
        >
          记一餐
        </Button>
      </div>

      {/* 日期切换 */}
      <div className="hj-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
        <Button type="text" icon={<LeftOutlined />} onClick={() => setDate(d => d.subtract(1, 'day'))} />
        <DatePicker
          value={date}
          onChange={d => d && setDate(d)}
          allowClear={false}
          format="M月D日 dddd"
          variant="borderless"
          inputReadOnly
        />
        <Button
          type="text"
          icon={<RightOutlined />}
          disabled={date.isSame(dayjs(), 'day')}
          onClick={() => setDate(d => d.add(1, 'day'))}
        />
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : error ? (
        <Alert type="error" message="加载失败" description={error} action={<Button onClick={reload}>重试</Button>} />
      ) : data ? (
        <>
          {/* 日汇总 */}
          <div className="hj-card">
            <div className="hj-card-title">
              <span>
                {data.summary.totalKcal} / {data.summary.budgetKcal} kcal
              </span>
              <Tag color={data.summary.deltaKcal > 0 ? 'orange' : 'green'}>
                {data.summary.deltaKcal > 0
                  ? `超出 ${data.summary.deltaKcal}`
                  : `剩余 ${-data.summary.deltaKcal}`}
              </Tag>
            </div>
            <MacroBar
              label="蛋白质"
              kind="protein"
              value={data.summary.proteinG}
              target={budgetQ.data?.proteinG ?? 140}
            />
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#8d9992' }}>
              <span>碳水 {Math.round(data.summary.carbsG)}g</span>
              <span>脂肪 {Math.round(data.summary.fatG)}g</span>
              <span>{data.summary.mealsLogged} 餐</span>
            </div>
          </div>

          {/* 餐次列表 */}
          {data.meals.length === 0 ? (
            <div className="hj-card">
              <Empty description="这一天还没有记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            data.meals.map(m => (
              <div className="hj-card" key={m.id}>
                <div className="hj-card-title">
                  <span>
                    {MEAL_LABEL[m.mealType]}
                    {m.mealTime ? ` · ${m.mealTime}` : ''}
                    {m.source === 'photo' && (
                      <CameraOutlined style={{ marginLeft: 6, color: '#8d9992' }} />
                    )}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <b style={{ color: '#1c2b25' }}>{m.totalKcal} kcal</b>
                    <Popconfirm
                      title="删除这餐记录？"
                      onConfirm={async () => {
                        await api.mealDelete(m.id);
                        message.success('已删除');
                        reload();
                        rangeQ.reload();
                      }}
                    >
                      <DeleteOutlined style={{ color: '#c3cec8' }} />
                    </Popconfirm>
                  </span>
                </div>
                {m.items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      color: '#3c4a44',
                      padding: '4px 0',
                    }}
                  >
                    <span>
                      {it.name}
                      <span style={{ color: '#a8b3ad', marginLeft: 6, fontSize: 12 }}>{it.portion}</span>
                    </span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{it.kcal} kcal</span>
                  </div>
                ))}
                <div className="hj-sub">
                  蛋白 {m.proteinG}g · 碳水 {m.carbsG}g · 脂肪 {m.fatG}g
                  {m.notes ? ` · ${m.notes}` : ''}
                </div>
              </div>
            ))
          )}
        </>
      ) : null}

      {/* 30 天热量趋势 */}
      <div className="hj-card">
        <div className="hj-card-title">近 30 天摄入</div>
        {barOption && rangeQ.data && rangeQ.data.length > 0 ? (
          <ReactECharts option={barOption} style={{ height: 180 }} notMerge />
        ) : (
          <div className="hj-sub">暂无数据</div>
        )}
      </div>

      {/* 记一餐 */}
      <Drawer
        title={`记一餐 · ${date.format('M月D日')}`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        placement="bottom"
        height="88%"
        extra={
          <Button type="primary" loading={saving} onClick={submit}>
            保存（{itemsTotal} kcal）
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <div className="hj-grid-2">
            <Form.Item name="mealType" label="餐次" rules={[{ required: true }]}>
              <Select
                options={Object.entries(MEAL_LABEL).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item name="mealTime" label="时间">
              <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={5} inputReadOnly />
            </Form.Item>
          </div>

          <Segmented
            block
            value={mode}
            onChange={v => setMode(v as any)}
            options={[
              { value: 'photo', label: '拍照识别' },
              { value: 'manual', label: '手动录入' },
            ]}
            style={{ marginBottom: 14 }}
          />

          {mode === 'photo' && (
            <div style={{ marginBottom: 14 }}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) onPickPhoto(f);
                  e.target.value = '';
                }}
              />
              <Button
                icon={<CameraOutlined />}
                block
                size="large"
                onClick={() => fileRef.current?.click()}
                disabled={recognizing}
              >
                {recognizing ? '识别中…' : '拍照 / 选择照片'}
              </Button>
              {recognizing && (
                <div style={{ textAlign: 'center', padding: 16 }}>
                  <Spin />
                </div>
              )}
              {recognizeNote && (
                <Alert type="success" message={recognizeNote} style={{ marginTop: 10 }} showIcon />
              )}
            </div>
          )}

          {/* 食物明细（识别结果可编辑 / 手动录入共用） */}
          {items.map((it, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid #eef2f0',
                borderRadius: 10,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Input
                  placeholder="食物名称"
                  value={it.name}
                  onChange={e =>
                    setItems(arr => arr.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)))
                  }
                />
                <Input
                  placeholder="分量"
                  style={{ width: 110 }}
                  value={it.portion}
                  onChange={e =>
                    setItems(arr => arr.map((x, i) => (i === idx ? { ...x, portion: e.target.value } : x)))
                  }
                />
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  onClick={() => setItems(arr => (arr.length > 1 ? arr.filter((_, i) => i !== idx) : arr))}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {(
                  [
                    ['kcal', 'kcal'],
                    ['proteinG', '蛋白g'],
                    ['carbsG', '碳水g'],
                    ['fatG', '脂肪g'],
                  ] as const
                ).map(([field, label]) => (
                  <InputNumber
                    key={field}
                    placeholder={label}
                    prefix={<span style={{ fontSize: 10, color: '#a8b3ad' }}>{label}</span>}
                    value={it[field] || undefined}
                    min={0}
                    style={{ width: '100%' }}
                    inputMode="decimal"
                    onChange={v =>
                      setItems(arr => arr.map((x, i) => (i === idx ? { ...x, [field]: Number(v) || 0 } : x)))
                    }
                  />
                ))}
              </div>
            </div>
          ))}
          <Button type="dashed" block onClick={() => setItems(arr => [...arr, emptyItem()])} style={{ marginBottom: 14 }}>
            + 添加一项
          </Button>

          <Form.Item name="notes" label="备注">
            <Input placeholder="可选" />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}

export default function MealsPage() {
  return (
    <Guard>
      <MealsContent />
    </Guard>
  );
}
