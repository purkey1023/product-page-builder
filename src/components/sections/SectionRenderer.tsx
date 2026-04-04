'use client'

import type { Section } from '@/types'
import { HeroSection } from './HeroSection'
import { BenefitsSection } from './BenefitsSection'
import { FeaturesSection } from './FeaturesSection'
import { TargetSection } from './TargetSection'
import { HowToSection } from './HowToSection'
import { CtaSection } from './CtaSection'

interface SectionRendererProps {
  section: Section
  productImageUrl: string
  isSelected: boolean
  onSelect: () => void
}

export function SectionRenderer(props: SectionRendererProps) {
  switch (props.section.type) {
    case 'hero':     return <HeroSection {...props} />
    case 'benefits': return <BenefitsSection {...props} />
    case 'features': return <FeaturesSection {...props} />
    case 'target':   return <TargetSection {...props} />
    case 'howto':    return <HowToSection {...props} />
    case 'cta':      return <CtaSection {...props} />
    default:         return null
  }
}
