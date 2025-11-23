
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { Card } from '../components/UI';

// Define Leaflet on window
declare global {
    interface Window {
        L: any;
    }
}

export const SearchPage: React.FC = () => {
  const { products, vendors } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null); // Reference to the layer group holding markers
  
  const approvedProducts = products.filter(p => 
    p.status === 'approved' && 
    p.title.toLowerCase().includes(query.toLowerCase())
  );

  // 1. Initialize Map (Run ONCE)
  useEffect(() => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      if (window.L) {
        // Default Center: University of Ghana, Legon (Example Campus)
        const defaultCenter = [5.6506, -0.1962]; 
        
        const map = window.L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView(defaultCenter, 15);

        // Light Map Style
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        // Create a LayerGroup to hold markers (allows clearing them without destroying the map)
        const markersLayer = window.L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;
        mapInstanceRef.current = map;
      }

      // Cleanup on unmount
      return () => {
          if (mapInstanceRef.current) {
              mapInstanceRef.current.remove();
              mapInstanceRef.current = null;
              markersLayerRef.current = null;
          }
      };
  }, []); 

  // 2. Update Markers (Run when vendors change)
  useEffect(() => {
      if (!mapInstanceRef.current || !markersLayerRef.current || !window.L) return;

      // Clear existing markers before adding new ones
      markersLayerRef.current.clearLayers();

      const defaultCenter = [5.6506, -0.1962];
      const map = mapInstanceRef.current;

      vendors.filter(v => v.isApproved).forEach((v, index) => {
            // Simulate scattered locations around campus for demo purposes
            const latOffset = (Math.sin(index + 1) * 0.005); 
            const lngOffset = (Math.cos(index + 1) * 0.005);
            const position = [defaultCenter[0] + latOffset, defaultCenter[1] + lngOffset];

            const customIcon = window.L.divIcon({
                className: 'custom-map-pin',
                html: `
                    <div class="relative group cursor-pointer">
                        <div class="w-12 h-12 bg-white rounded-full p-1 shadow-lg border-2 border-white transform transition-transform">
                            <img src="${v.storeAvatarUrl || 'https://via.placeholder.com/40'}" class="w-full h-full rounded-full object-cover bg-gray-100" />
                        </div>
                        <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white shadow-sm"></div>
                        ${v.isApproved ? '<div class="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full border border-white shadow-sm"><i class="fa-solid fa-check"></i></div>' : ''}
                    </div>
                `,
                iconSize: [48, 48],
                iconAnchor: [24, 54]
            });

            const marker = window.L.marker(position, { icon: customIcon });
            
            // Custom Popup
            const popupContent = `
                <div class="text-center min-w-[120px]">
                    <h3 class="font-bold text-gray-900 text-sm mb-1">${v.storeName}</h3>
                    <p class="text-xs text-gray-500 mb-2">${v.location}</p>
                    <button id="visit-store-${v.vendorId}" class="bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-full w-full">Visit Store</button>
                </div>
            `;
            
            marker.bindPopup(popupContent, { closeButton: false, offset: [0, -40] });

            // Handle Popup Button Click
            marker.on('popupopen', () => {
                 const btn = document.getElementById(`visit-store-${v.vendorId}`);
                 if(btn) {
                     btn.onclick = () => navigate(`/store/${v.vendorId}`);
                 }
            });
            
            // Click to center
            marker.on('click', () => {
                map.setView(position, 16, { animate: true });
            });

            // Add to the LayerGroup instead of the map directly
            markersLayerRef.current.addLayer(marker);
      });

  }, [vendors, navigate]); // Dependencies: Re-run when vendors list updates

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-100 flex flex-col">
      
      {/* Top Search Bar (Floating) */}
      <div className="absolute top-4 left-4 right-4 z-30 animate-slide-up">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-float flex items-center p-3 border border-white/20">
            <i className="fa-solid fa-arrow-left text-gray-400 mr-3 cursor-pointer hover:text-gray-800 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors" onClick={() => navigate(-1)}></i>
            <input 
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Products..."
                className="flex-grow bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
            />
             {query && <i className="fa-solid fa-xmark text-gray-400 cursor-pointer p-2 hover:text-red-500 transition-colors" onClick={() => setQuery('')}></i>}
        </div>
        
        {/* Quick Filter Chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar pb-2 pl-1">
            {['Food', 'Electronics', 'Services', 'Books'].map(f => (
                <span key={f} className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold shadow-sm text-gray-600 whitespace-nowrap border border-white/50 hover:bg-white hover:text-primary transition-all cursor-pointer active:scale-95">
                    {f}
                </span>
            ))}
        </div>
      </div>

      {/* Interactive Map Container */}
      <div className="absolute inset-0 z-0" onClick={() => setIsDrawerOpen(false)}>
          <div ref={mapContainerRef} className="w-full h-full outline-none" />
      </div>

      {/* Bottom Drawer (Draggable/Expandable) */}
      <div 
        className={`absolute left-0 right-0 bottom-0 bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20 transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col ${isDrawerOpen ? 'h-[60vh]' : 'h-[14vh]'}`}
      >
        {/* Drag Handle */}
        <div 
            className="w-full py-4 flex justify-center cursor-grab active:cursor-grabbing touch-pan-y"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Drawer Content */}
        <div className="flex-grow overflow-y-auto px-5 pb-20 hide-scrollbar">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-2 z-10">
                <h3 className="font-bold text-gray-800 text-lg font-display">{approvedProducts.length} Results Nearby</h3>
                <span className="text-xs text-primary font-bold bg-primary/10 px-3 py-1 rounded-full cursor-pointer hover:bg-primary/20 transition-colors">Filters</span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                {approvedProducts.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <p>No products found in this area.</p>
                    </div>
                ) : (
                    approvedProducts.map(product => {
                        const vendor = vendors.find(v => v.vendorId === product.vendorId);
                        return (
                            <div key={product.id} className="flex bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer hover:shadow-md" onClick={() => navigate(`/buyer/product/${product.id}`)}>
                                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                                    <img src={product.images[0] || 'https://via.placeholder.com/80'} className="w-full h-full object-cover" alt={product.title} />
                                </div>
                                <div className="ml-3 flex-grow flex flex-col justify-center py-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-900 line-clamp-1 text-sm font-display">{product.title}</h4>
                                        {vendor?.isApproved && <i className="fa-solid fa-circle-check text-blue-500 text-[10px] mt-1" title="Verified Vendor"></i>}
                                    </div>
                                    <p className="text-xs text-gray-500 mb-auto mt-1 line-clamp-1">
                                        {vendor?.storeName}
                                    </p>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="font-extrabold text-gray-900 text-base">{product.currency}{product.price}</span>
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg flex items-center gap-1">
                                            <i className="fa-solid fa-location-dot text-primary"></i> {product.location}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
