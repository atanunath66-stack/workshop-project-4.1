import React from 'react';
import { useApp } from '../../context/AppContext';
import { FoodCategory } from '../../types';

export const CategoryBar: React.FC = () => {
  const { activeCategory, setActiveCategory } = useApp();

  const CATEGORIES: Array<{ name: FoodCategory | 'All'; icon: string }> = [
    { name: 'All', icon: '🍽️' },
    { name: 'Street Food', icon: '🥟' },
    { name: 'Fast Food', icon: '🌯' },
    { name: 'Chinese', icon: '🥢' },
    { name: 'Indian', icon: '🍛' },
    { name: 'Bengali Food', icon: '🐟' },
    { name: 'South Indian', icon: '🥞' },
    { name: 'Cafés', icon: '☕' },
    { name: 'Bakeries', icon: '🥐' },
    { name: 'Desserts', icon: '🍨' },
    { name: 'Beverages', icon: '🧋' },
    { name: 'Family Restaurants', icon: '🍲' },
    { name: 'Local Specialties', icon: '✨' },
  ];

  return (
    <section className="bg-white border-b border-[#E8E8EC] py-3 sticky top-16 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FCE8EF] text-[#34343A] border border-[#F8D3DF] font-bold shadow-xs'
                    : 'bg-[#F7F7F8] hover:bg-[#E5E7EB] text-[#777781] border border-[#E8E8EC]'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
