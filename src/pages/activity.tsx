import React, { useState } from 'react';
import { Alert, Button, List, Segmented, Skeleton, Tag } from 'antd';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import Guard from '@/components/Guard';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/api/health';

function ActivityContent() {
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = useFetch(() => api.activityList(days), [days]);

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (error)
    return (
      <Alert type="error" message="加载失败" description={error} action={<Button onClick={reload}>重试</Button>} />
    );
  const records = data || [];

  const axis = {
    xAxis: {
      type: 'category',
      data: records.map(r => dayjs(r.date).format('M/D')),
      axisLabel: { fontSize: 10, color: '#8d9992' },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#eceeed' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10, color: '#8d9992' },
      splitLine: { lineStyle: { color: '#f0f3f1' } },
    },
    tooltip: { trigger: 'axis' },
    grid: { left: 46, right: 12, top: 14, bottom: 24 },
  };

  const stepsOption = {
    ...axis,
    series: [
      {
        type: 'bar',
        data: records.map(r => r.steps),
        barMaxWidth: 14,
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
      },
    ],
  };

  const energyOption = {
    ...axis,
    series: [
      {
        name: '活动能量',
        type: 'line',
        smooth: true,
        data: records.map(r => r.activeKcal),
        lineStyle: { color: '#f59e0b', width: 2.5 },
        itemStyle: { color: '#f59e0b' },
      },
      {
        name: '总消耗',
        type: 'line',
        smooth: true,
        data: records.map(r =>
          r.activeKcal != null && r.restingKcal != null ? r.activeKcal + r.restingKcal : null
        ),
        lineStyle: { color: '#3b82f6', width: 2.5 },
        itemStyle: { color: '#3b82f6' },
      },
    ],
    legend: { bottom: 0, textStyle: { fontSize: 10, color: '#8d9992' } },
    grid: { left: 46, right: 12, top: 14, bottom: 40 },
  };

  return (
    <>
      <div className="hj-page-title">活动数据</div>

      <div className="hj-card" style={{ padding: '10px 16px' }}>
        <Segmented
          block
          value={days}
          onChange={v => setDays(v as number)}
          options={[
            { label: '近 7 天', value: 7 },
            { label: '近 30 天', value: 30 },
            { label: '近 90 天', value: 90 },
          ]}
        />
      </div>

      {records.length === 0 ? (
        <div className="hj-card">
          <Alert
            type="info"
            message="暂无活动数据"
            description="配置 iOS 快捷指令后，Apple Watch 的步数、活动能量、锻炼与睡眠会在白天多次自动同步到这里，同一天覆盖式更新（配置指南见 health 仓库 docs/ios-shortcut.md）。"
            showIcon
          />
        </div>
      ) : (
        <>
          <div className="hj-card">
            <div className="hj-card-title">步数</div>
            <ReactECharts option={stepsOption} style={{ height: 180 }} notMerge />
          </div>
          <div className="hj-card">
            <div className="hj-card-title">能量消耗（kcal）</div>
            <ReactECharts option={energyOption} style={{ height: 200 }} notMerge />
          </div>
          <div className="hj-card">
            <div className="hj-card-title">明细</div>
            <List
              dataSource={[...records].reverse()}
              renderItem={r => (
                <List.Item style={{ padding: '10px 0' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#1c2b25', fontWeight: 600 }}>
                      {dayjs(r.date).format('M月D日')}
                      {r.workouts.map((w, i) => (
                        <Tag key={i} style={{ marginLeft: 6 }} color="blue">
                          {w.type} {w.minutes}min
                        </Tag>
                      ))}
                    </div>
                    <div className="hj-sub">
                      {r.steps != null && `${r.steps} 步 · `}
                      {r.activeKcal != null && `活动 ${r.activeKcal} kcal · `}
                      {r.exerciseMinutes != null && `锻炼 ${r.exerciseMinutes} 分钟 · `}
                      {r.sleepHours != null && `睡眠 ${r.sleepHours} 小时`}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </>
      )}
    </>
  );
}

export default function ActivityPage() {
  return (
    <Guard>
      <ActivityContent />
    </Guard>
  );
}
