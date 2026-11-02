'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { storage } from '@/lib/storage';
import { quizService, type Board, type QuizMe, type QuizStatus } from '@/services/quiz.service';
import RankCard from './RankCard';
import BoardList from './BoardList';
import './quiz.css';

/** Hub of the quiz practice (/competitions/[id]/luyen-tap without a mode): the player's rank, the three ways to play and this week's top 5. */
export default function QuizTab({ competitionId, status }: { competitionId: number; status: QuizStatus }) {
  const { t } = useI18n();
  const signedIn = !!storage.getToken();
  const [me, setMe] = useState<QuizMe | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const base = `/competitions/${competitionId}/luyen-tap`;

  useEffect(() => {
    if (signedIn) quizService.me().then(setMe).catch(() => {});
    if (status.boardEnabled) quizService.board('week').then(setBoard).catch(() => {});
  }, [signedIn, status.boardEnabled]);

  return (
    <div className="qz">
      <div className="qz-card of-cut">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="pp-hud" style={{ color: 'var(--lime-2)' }}>{t('Luyện tập Football IQ')}</span>
          {status.testing && <span className="qz-test">{t('Đang thử · chỉ quản trị thấy')}</span>}
        </div>
        <p className="pp-mute" style={{ margin: '8px 0 0', fontSize: 14.5, lineHeight: 1.5 }}>
          {t('Câu hỏi về luật, chiến thuật, tâm lý và tình huống trên sân, giống phần thi kiến thức và tư duy ở vòng tuyển trạch. Trả lời đúng để lên hạng từ Phong trào tới Huyền thoại.')}
        </p>
      </div>

      {signedIn && me && (
        <RankCard
          rank={me.rank} rankLabel={me.rankLabel} stars={me.stars} starsPerRank={me.starsPerRank} guard={me.guard} ranks={me.ranks}
          extra={<div className="qz-meta"><span>{t('Đã trả lời')} <b>{me.answered}</b></span><span>{t('Đúng')} <b>{me.answered ? Math.round((100 * me.correct) / me.answered) : 0}%</b></span><span>{t('Chuỗi tốt nhất')} <b>{me.bestStreak}</b></span></div>}
        />
      )}

      {signedIn ? (
        <div className="qz-modes">
          <Link href={`${base}?mode=rank`} className="qz-mode main of-cut">
            <b>{t('Leo hạng')}</b>
            <span>{t('Mỗi câu {s} giây. Đúng được 1 sao, sai mất 1 sao. Đủ sao thì lên hạng.', { s: me?.seconds ?? 30 })}</span>
          </Link>
          <Link href={`${base}?mode=practice`} className="qz-mode of-cut">
            <b>{t('Luyện theo chủ đề')}</b>
            <span>{t('Chọn chủ đề và độ khó, không mất sao. Xem giải thích sau mỗi câu.')}</span>
          </Link>
          <Link href={`${base}?mode=mock`} className="qz-mode of-cut">
            <b>{t('Đề thi thử')}</b>
            <span>{t('{n} câu trong {m} phút, trộn đủ kiến thức, tư duy và tình huống.', { n: me?.mockSize ?? 20, m: me?.mockMinutes ?? 15 })}</span>
          </Link>
        </div>
      ) : (
        <div className="qz-card of-cut" style={{ display: 'grid', gap: 10, justifyItems: 'start' }}>
          <p style={{ margin: 0 }}>{t('Đăng nhập để luyện tập và lên bảng xếp hạng.')}</p>
          <Link href={`/auth/login?redirect=${encodeURIComponent(base)}`} className="pp-btn pp-btn-lime of-cut">{t('Đăng nhập')}</Link>
        </div>
      )}

      {status.boardEnabled && board && (
        <div className="qz-card of-cut" style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="pp-hud" style={{ color: 'var(--lime-2)' }}>{t('Bảng xếp hạng tuần')}</span>
            <Link href={`${base}/bang-xep-hang`} className="qz-link">{t('Xem tất cả')}</Link>
          </div>
          <BoardList rows={board.top} me={board.me} limit={5} mode="week" />
        </div>
      )}
    </div>
  );
}
