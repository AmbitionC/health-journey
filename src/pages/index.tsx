import React, { useState } from 'react';
import { Alert, Button, Skeleton, Tag, message } from 'antd';
import { BulbOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import Guard from '@/components/Guard';
import KcalRing from '@/components/KcalRing';
import MacroBar from '@/components/MacroBar';
import { useFetch } from '@/hooks/useFetch';
import { api, Overview } from '@/api/health';

function TodayContent() {
  const { data, loading, error, reload } = useFetch<Overview>(() =>
    api.overview()
  );
  const [advice, setAdvice] = useState<string | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  const fetchAdvice = async () => {
    setAdviceLoading(true);
    try {
      const res = await api.adviceToday();
      setAdvice(res.advice);
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setAdviceLoading(false);
    }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (error)
    return (
      <Alert
        type="error"
        message="加载失败"
        description={error}
        action={<Button onClick={reload}>重试</Button>}
      />
    );
  if (!data) return null;

  const { latestBody, bodyTrend, today, budget, activity, nextGoal } = data;
  const s = today.summary;

  const trendOption = {
    grid: { left: 40, right: 12, top: 10, bottom: 24 },
    xAxis: {
      type: 'category',
      data: bodyTrend.map(r => dayjs(r.date).format('M/D')),
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
        data: bodyTrend.map(r => r.weightKg),
        smooth: true,
        symbolSize: 6,
        lineStyle: { color: '#10b981', width: 2.5 },
        itemStyle: { color: '#10b981' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16,185,129,0.18)' },
              { offset: 1, color: 'rgba(16,185,129,0)' },
            ],
          },
        },
        markLine: nextGoal?.value
          ? {
              silent: true,
              symbol: 'none',
              data: [{ yAxis: nextGoal.value }],
              lineStyle: { color: '#f59e0b', type: 'dashed' },
              label: {
                formatter: `目标 ${nextGoal.value}`,
                fontSize: 10,
                color: '#f59e0b',
              },
            }
          : undefined,
      },
    ],
    tooltip: { trigger: 'axis' },
  };

  return (
    <>
      <div className="hj-page-title">
        今日 · {dayjs(data.date).format('M月D日 dddd')}
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={reload}
          style={{ float: 'right', color: '#8d9992' }}
        />
      </div>

      {/* 热量环 + 宏量 */}
      <div className="hj-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <KcalRing consumed={s.totalKcal} budget={s.budgetKcal} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div className="hj-sub" style={{ marginBottom: 8 }}>
              已摄入 <b style={{ color: '#1c2b25' }}>{s.totalKcal}</b> / 预算{' '}
              <b style={{ color: '#1c2b25' }}>{s.budgetKcal}</b> kcal ·{' '}
              {s.mealsLogged} 餐
              <Tag
                style={{ marginLeft: 6 }}
                color={budget.basis.tdeeSource === 'measured' ? 'green' : 'default'}
              >
                {budget.basis.tdeeSource === 'measured'
                  ? 'Watch 实测'
                  : '系数估算'}
              </Tag>
            </div>
            <MacroBar label="蛋白质" kind="protein" value={s.proteinG} target={budget.proteinG} />
            <MacroBar label="碳水" kind="carbs" value={s.carbsG} target={budget.carbsG} />
            <MacroBar label="脂肪" kind="fat" value={s.fatG} target={budget.fatG} />
          </div>
        </div>
      </div>

      {/* AI 建议 */}
      <div className="hj-card">
        <div className="hj-card-title">
          <span>
            <BulbOutlined style={{ marginRight: 6 }} />
            接下来怎么吃
          </span>
          <Button size="small" loading={adviceLoading} onClick={fetchAdvice}>
            {advice ? '刷新建议' : '获取建议'}
          </Button>
        </div>
        {advice ? (
          <div style={{ fontSize: 13, lineHeight: 1.8, color: '#3c4a44', whiteSpace: 'pre-wrap' }}>
            {advice}
          </div>
        ) : (
          <div className="hj-sub">基于今日剩余预算与身体数据生成个性化建议</div>
        )}
      </div>

      {/* 体重 + 目标 */}
      <div className="hj-grid-2">
        <div className="hj-card" style={{ marginBottom: 12 }}>
          <div className="hj-card-title">当前体重</div>
          <div className="hj-metric">
            <span className="num">{latestBody?.weightKg ?? '--'}</span>
            <span className="unit">kg</span>
          </div>
          {latestBody && (
            <div className="hj-sub">
              {dayjs(latestBody.date).format('M月D日')} · 体脂{' '}
              {latestBody.bodyFatPct ?? '--'}%
            </div>
          )}
        </div>
        <div className="hj-card" style={{ marginBottom: 12 }}>
          <div className="hj-card-title">下一目标</div>
          {nextGoal ? (
            <>
              <div className="hj-metric">
                <span className="num" style={{ color: '#f59e0b' }}>
                  -{data.nextGoalRemainingKg}
                </span>
                <span className="unit">kg 待减</span>
              </div>
              <div className="hj-sub">
                {nextGoal.horizon}：{nextGoal.target}
              </div>
            </>
          ) : (
            <div className="hj-sub">所有阶段目标已达成 🎉</div>
          )}
        </div>
      </div>

      {/* 今日活动 */}
      <div className="hj-card">
        <div className="hj-card-title">今日活动</div>
        {activity ? (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div className="hj-metric">
                <span className="num">{activity.steps ?? '--'}</span>
                <span className="unit">步</span>
              </div>
            </div>
            <div>
              <div className="hj-metric">
                <span className="num">{activity.activeKcal ?? '--'}</span>
                <span className="unit">kcal 活动</span>
              </div>
            </div>
            <div>
              <div className="hj-metric">
                <span className="num">{activity.exerciseMinutes ?? '--'}</span>
                <span className="unit">分钟锻炼</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="hj-sub">
            今日暂无同步数据 · 由 iOS 快捷指令每晚自动推送
          </div>
        )}
      </div>

      {/* 90 天体重趋势 */}
      <div className="hj-card">
        <div className="hj-card-title">体重趋势（90 天）</div>
        {bodyTrend.length > 1 ? (
          <ReactECharts option={trendOption} style={{ height: 200 }} />
        ) : (
          <div className="hj-sub">记录 2 次以上体重后显示趋势</div>
        )}
      </div>
    </>
  );
}

export default function TodayPage() {
  return (
    <Guard>
      <TodayContent />
    </Guard>
  );
}
