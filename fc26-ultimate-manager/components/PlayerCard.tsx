
import React, { useRef, useState } from 'react';
import { Player, Position } from '../types';
import { CARD_DESIGNS } from '../constants';
import { Coins, Flag } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showDelete?: boolean;
  onDelete?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
  onReward?: (e: React.MouseEvent) => void;
  disableHover?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  size = 'md', 
  onClick, 
  showDelete, 
  onDelete,
  onEdit,
  onReward,
  disableHover
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 0, y: 0, opacity: 0 });

  const isGK = player.position === Position.GK;
  const design = CARD_DESIGNS[player.cardType] || CARD_DESIGNS.gold;
  
  // Scaling classes
  const sizeClasses = {
    sm: "w-32 h-[148px] text-[0.5rem]", 
    md: "w-60 h-[296px] text-xs",      
    lg: "w-80 h-[395px] text-sm"       
  };
  
  // Helper for stat names map
  const statLabels: Record<string, string> = isGK 
    ? { DIV: 'HEC', HAN: 'BAL', KIC: 'ABS', REF: 'REF', SPE: 'TEM', POS: 'STE' }
    : { PAC: 'TEM', SHO: 'SCH', PAS: 'PAS', DRI: 'DRI', DEF: 'DEF', PHY: 'PHY' };

  // Helper for stat keys order
  const statKeys = isGK 
    ? ['DIV', 'HAN', 'KIC', 'REF', 'SPE', 'POS']
    : ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'];

  // Dynamic Styles
  const cardStyle: React.CSSProperties = {
    backgroundImage: `url(${design.url})`,
    backgroundSize: '100% 100%',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    color: design.textColor,
    transform: disableHover ? 'none' : `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
  };
  
  const shapeClass = "rounded-t-2xl rounded-b-[2.5rem]";
  const isSmall = size === 'sm';
  
  // Adjusted vertical positions
  const textContainerPosition = isSmall ? 'bottom-[16%]' : 'bottom-[8%]';
  const ratingPosition = isSmall ? 'top-[18%]' : 'top-[20%]';

  // --- TILT LOGIC ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disableHover || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -10; // Max tilt deg
    const rotateY = ((x - centerX) / centerX) * 10;

    setRotation({ x: rotateX, y: rotateY });
    
    // Shine effect calculation
    setShine({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setShine({ ...shine, opacity: 0 });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative ${sizeClasses[size]} ${shapeClass} flex flex-col select-none transition-transform duration-100 ease-out cursor-pointer group shrink-0 overflow-hidden ${!disableHover ? 'hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] hover:z-20' : ''}`}
      style={cardStyle}
    >
      {/* Holo Shine Overlay */}
      {!disableHover && (
          <div 
            className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay transition-opacity duration-300"
            style={{
                background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)`,
                opacity: shine.opacity
            }}
          ></div>
      )}

      {/* Admin Actions Overlay */}
      {showDelete && (
        <div className="absolute top-2 right-2 z-30 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
           {onReward && (
            <button onClick={onReward} title="Punkt vergeben (Anwesenheit)" className="bg-yellow-500/90 text-white p-1.5 rounded-full hover:bg-yellow-400 shadow-lg backdrop-blur-sm mb-1 transform hover:scale-110 transition">
               <Coins size={14} />
            </button>
           )}
           {onEdit && (
            <button onClick={onEdit} className="bg-blue-600/90 text-white p-1.5 rounded-full hover:bg-blue-500 shadow-lg backdrop-blur-sm">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
            </button>
           )}
           {onDelete && (
            <button onClick={onDelete} className="bg-red-600/90 text-white p-1.5 rounded-full hover:bg-red-500 shadow-lg backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
           )}
        </div>
      )}

      {/* Content Wrapper */}
      <div className="absolute inset-0 flex flex-col p-2 z-10" style={{ color: design.textColor }}>
        
        {/* Top Info (Rating & Position) - SHIFTED LEFT */}
        <div className={`absolute ${ratingPosition} left-[8%] w-[20%] flex flex-col items-center leading-none text-center`}>
            <span className={`font-bold block ${size === 'lg' ? 'text-5xl' : size === 'md' ? 'text-3xl' : 'text-xl'}`}>{player.rating}</span>
            <span className={`font-medium uppercase block ${size === 'lg' ? 'text-xl mt-1' : size === 'md' ? 'text-sm' : 'text-[0.6rem]'}`}>{player.position}</span>
            {/* Nation removed from here */}
        </div>

        {/* Player Image */}
        <div className="absolute bottom-[31%] left-1/2 -translate-x-1/2 w-[70%] h-[50%] z-0 flex items-end justify-center">
            <img 
            src={player.image} 
            alt={player.name} 
            className="w-full h-full object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
            onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Player';
            }}
            />
        </div>

        {/* Name and Stats Area */}
        <div className={`absolute ${textContainerPosition} left-0 right-0 mx-auto flex flex-col items-center w-full z-10 px-2`}>
            {/* Name */}
            <h3 className={`font-bold tracking-wide text-center truncate w-full leading-none ${size === 'lg' ? 'text-2xl mb-2' : size === 'md' ? 'text-lg mb-1' : 'text-[0.6rem] mb-[1px]'}`}>
                {player.name}
            </h3>
            
            {/* Stats */}
            {!isSmall && (
                <div className="flex justify-center items-end w-[85%]">
                    {statKeys.map((key) => {
                        const voteScore = player.votes?.[key]?.score || 0;
                        const isUp = voteScore > 0;
                        const isDown = voteScore < 0;
                        
                        const statColorClass = isUp 
                            ? 'text-green-600 drop-shadow-sm font-black' 
                            : isDown 
                                ? 'text-red-600 drop-shadow-sm font-black' 
                                : '';

                        return (
                            <div key={key} className="flex flex-col items-center flex-1 relative group/stat leading-none">
                                {/* Label First */}
                                <span className={`${size === 'lg' ? 'text-xs' : 'text-[0.7rem]'} uppercase font-bold opacity-80`}>
                                    {statLabels[key]}
                                </span>
                                {/* Value Second */}
                                <span className={`font-normal flex items-center ${size === 'lg' ? 'text-3xl' : 'text-xl'} ${statColorClass} -mt-1`}>
                                    {player.stats[key as keyof typeof player.stats]}
                                </span>
                                
                                {/* Vote Indicators */}
                                {isUp && <span className="absolute -top-1 -right-0 text-[8px] text-green-600">▲</span>}
                                {isDown && <span className="absolute -top-1 -right-0 text-[8px] text-red-600">▼</span>}
                            </div>
                        );
                    })}
                </div>
            )}
            
            {/* Small view backup */}
            {isSmall && <div className="text-[0.4rem] opacity-70 mb-[2px] leading-none">FC26</div>}

            {/* Bottom Footer: Nation & Club - ADDED HERE */}
            {!isSmall && (
                <div className="mt-1 w-full flex flex-col items-center justify-center gap-0.5">
                     {player.nation && (
                        <span className={`${size === 'lg' ? 'text-xl' : 'text-lg'} drop-shadow-sm leading-none`} role="img" aria-label="nation">{player.nation}</span>
                     )}
                     {player.club && (
                        <span className="text-[10px] font-semibold truncate max-w-[80%] uppercase tracking-wider opacity-80">{player.club}</span>
                     )}
                </div>
            )}
        </div>
      </div>
      
    </div>
  );
};

export default PlayerCard;
