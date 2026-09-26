import type { Category } from '@/types'

const now = new Date().toISOString()

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-health', name: 'Health', icon: '🩺', color: '#2F6F62', isCustom: false, createdAt: now },
  { id: 'cat-fitness', name: 'Fitness', icon: '🏃', color: '#B8792E', isCustom: false, createdAt: now },
  { id: 'cat-study', name: 'Study', icon: '📚', color: '#4F6D8C', isCustom: false, createdAt: now },
  { id: 'cat-work', name: 'Work', icon: '💼', color: '#6B5B95', isCustom: false, createdAt: now },
  { id: 'cat-personal', name: 'Personal', icon: '🌱', color: '#7CB6A5', isCustom: false, createdAt: now },
  { id: 'cat-finance', name: 'Finance', icon: '💰', color: '#8A7150', isCustom: false, createdAt: now },
  { id: 'cat-sleep', name: 'Sleep', icon: '🌙', color: '#5B6B8C', isCustom: false, createdAt: now },
  { id: 'cat-nutrition', name: 'Nutrition', icon: '🥗', color: '#5C8A4A', isCustom: false, createdAt: now },
  { id: 'cat-mindfulness', name: 'Mindfulness', icon: '🧘', color: '#8A6FA8', isCustom: false, createdAt: now },
  { id: 'cat-other', name: 'Other', icon: '✨', color: '#7A8A82', isCustom: false, createdAt: now },
]
