import React, { useState } from 'react'
import { Award, Camera, Sparkles, MessageCircle, Heart } from 'lucide-react'
import { useCustomerAuth } from '../context/AuthContext'
import { SAMPLE_UGC_PHOTOS } from '../lib/mockData'
import { PointsBalanceCard } from '../components/club/PointsBalanceCard'
import { MissionsList } from '../components/club/MissionsList'
import { ReferralShareCard } from '../components/club/ReferralShareCard'
import { RewardsCatalog } from '../components/club/RewardsCatalog'
import { UgcPhotoUploaderModal } from '../components/club/UgcPhotoUploaderModal'
import { ReviewOrderModal } from '../components/club/ReviewOrderModal'

export const ClubPage: React.FC = () => {
  const { customer } = useCustomerAuth()
  const [isUgcModalOpen, setIsUgcModalOpen] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  if (!customer) return null

  return (
    <div className="space-y-5 px-4 pb-24">
      {/* Points & Tier Card */}
      <PointsBalanceCard customer={customer} />

      {/* Referral Viral Share */}
      <ReferralShareCard referralCode={customer.referral_code} />

      {/* Gamification Missions */}
      <MissionsList
        onOpenUgcModal={() => setIsUgcModalOpen(true)}
        onOpenReviewModal={() => setIsReviewModalOpen(true)}
        onOpenReferralModal={() => {
          const el = document.getElementById('referral-section')
          el?.scrollIntoView({ behavior: 'smooth' })
        }}
      />

      {/* Community UGC Gallery Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-gold" />
            <span>Muebles en Casa (Comunidad Only)</span>
          </h3>
          <button
            onClick={() => setIsUgcModalOpen(true)}
            className="text-xs text-brand-blue dark:text-brand-lightBlue font-bold hover:underline"
          >
            + Subir Foto
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {SAMPLE_UGC_PHOTOS.map((ugc) => (
            <div
              key={ugc.id}
              className="rounded-2xl overflow-hidden glass-card bg-card border border-border/80 shadow-sm relative group"
            >
              <div className="aspect-square bg-secondary/30 relative">
                <img
                  src={ugc.media_url}
                  alt="UGC"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/70 text-gold text-[9px] font-bold font-mono">
                  +1.000 pts
                </span>
              </div>
              <div className="p-2.5">
                <p className="text-[11px] text-foreground font-medium line-clamp-2 leading-tight">
                  {ugc.caption}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5">
                  <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                  <span>Verificado Only</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Redeemable Rewards Catalog */}
      <RewardsCatalog userPoints={customer.total_points} />

      {/* Modals */}
      <UgcPhotoUploaderModal
        isOpen={isUgcModalOpen}
        onClose={() => setIsUgcModalOpen(false)}
        onSuccessAward={() => {}}
      />

      <ReviewOrderModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccessAward={() => {}}
      />
    </div>
  )
}
