
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { Card, Button } from '../components/UI';
import { INITIAL_LOCATION_CACHE } from '../constants';

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
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null); 
  const routingLayerRef = useRef<any>(null);
  const coordCache = useRef<Record<string, [number, number]>>(INITIAL_LOCATION_CACHE);
  
  const approvedProducts = products.filter(p => 
    p.status === 'approved' && 
    p.title.toLowerCase().includes(query.toLowerCase())
  );

  // --- Helper: Fetch Coordinates ---
  const getCoordinates = async (locationName: string): Promise<[number, number]> => {
      const cleanName = locationName.toLowerCase().trim();
      if (coordCache.current[cleanName]) return coordCache.current[cleanName];
      const partialKey = Object.keys(coordCache.current).find(k => cleanName.includes(k));
      if (partialKey) return coordCache.current[partialKey];

      try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}, Ghana`);
          const data = await response.json();
          if (data && data.length > 0) {
              const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
              coordCache.current[cleanName] = coords;
              return coords;
          }
      } catch (e) { console.warn(`Geocoding failed for ${locationName}`, e); }
      return INITIAL_LOCATION_CACHE['legon'];
  };

  // 1. Initialize Map
  useEffect(() => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      if (window.L) {
        const defaultCenter = [5.6037, -0.1870]; // Default User Location (Mock)
        
        const map = window.L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false
        }).setView(defaultCenter, 13);

        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        const markersLayer = window.L.layerGroup().addTo(map);
        const routingLayer = window.L.layerGroup().addTo(map);
        
        markersLayerRef.current = markersLayer;
        routingLayerRef.current = routingLayer;
        mapInstanceRef.current = map;
      }

      return () => {
          if (mapInstanceRef.current) {
              mapInstanceRef.current.remove();
              mapInstanceRef.current = null;
              markersLayerRef.current = null;
              routingLayerRef.current = null;
          }
      };
  }, []); 

  // 2. Plot Vendors & Routing
  useEffect(() => {
      if (!mapInstanceRef.current || !markersLayerRef.current || !window.L) return;

      const map = mapInstanceRef.current;
      const markersLayer = markersLayerRef.current;
      const routingLayer = routingLayerRef.current;
      
      const plotVendors = async () => {
          markersLayer.clearLayers();
          routingLayer.clearLayers();
          
          const markersArray: any[] = [];
          const activeVendors = vendors.filter(v => v.isApproved);
          const userPos: [number, number] = [5.6037, -0.1870]; // Mock user pos for routing

          // Draw User Marker
          const userIcon = window.L.divIcon({
              className: 'custom-user-pin',
              html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md pulse-ring"></div>`,
              iconSize: [16, 16]
          });
          window.L.marker(userPos, { icon: userIcon }).addTo(markersLayer);

          for (const v of activeVendors) {
                const baseCoords = await getCoordinates(v.location);
                // Jitter
                const jitterLat = (Math.random() - 0.5) * 0.002;
                const jitterLng = (Math.random() - 0.5) * 0.002;
                const position = [baseCoords[0] + jitterLat, baseCoords[1] + jitterLng];

                // If this vendor sells the selected product, draw routing line
                const isSelected = selectedProductId && products.find(p => p.id === selectedProductId)?.vendorId === v.vendorId;

                if (isSelected) {
                    // Draw Line
                    const polyline = window.L.polyline([userPos, position], {
                        color: '#6366f1', // Primary color
                        weight: 4,
                        opacity: 0.7,
                        dashArray: '10, 10',
                        lineCap: 'round'
                    }).addTo(routingLayer);
                    
                    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
                }

                const customIcon = window.L.divIcon({
                    className: 'custom-map-pin',
                    html: `
                        <div class="relative group cursor-pointer hover:z-50 ${isSelected ? 'z-50 scale-125' : ''}">
                            <div class="w-10 h-10 bg-white rounded-full p-0.5 shadow-lg border-2 ${isSelected ? 'border-primary' : 'border-white'} transform transition-transform">
                                <img src="${v.storeAvatarUrl || 'https://via.placeholder.com/40'}" class="w-full h-full rounded-full object-cover bg-gray-100" />
                            </div>
                            <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${isSelected ? 'border-t-primary' : 'border-t-white'} shadow-sm"></div>
                        </div>
                    `,
                    iconSize: [40, 40],
                    iconAnchor: [20, 45]
                });

                const marker = window.L.marker(position, { icon: customIcon });
                markersLayer.addLayer(marker);
                markersArray.push(marker);
          }
      };

      plotVendors();

  }, [vendors, selectedProductId, products]);

  const handleProductSelect = (pid: string) => {
      setSelectedProductId(pid);
      setIsDrawerOpen(false); // Minify drawer to see map
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-100 flex flex-col">
      
      {/* Top Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 animate-slide-up">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-float flex items-center p-3 border border-white/20">
            <i className="fa-solid fa-arrow-left text-gray-400 mr-3 cursor-pointer hover:text-gray-800 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors" onClick={() => navigate(-1)}></i>
            <input 
                autoFocus
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedProductId(null); setIsDrawerOpen(true); }}
                placeholder="Search Products..."
                className="flex-grow bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
            />
             {(query || selectedProductId) && <i className="fa-solid fa-xmark text-gray-400 cursor-pointer p-2 hover:text-red-500 transition-colors" onClick={() => { setQuery(''); setSelectedProductId(null); setIsDrawerOpen(true); }}></i>}
        </div>
      </div>

      {/* Map */}
      <div className="absolute inset-0 z-0" onClick={() => setIsDrawerOpen(false)}>
          <div ref={mapContainerRef} className="w-full h-full outline-none" />
      </div>

      {/* Drawer */}
      <div 
        className={`absolute left-0 right-0 bottom-0 bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-30 transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col ${isDrawerOpen ? 'h-[60vh]' : 'h-[18vh]'}`}
      >
        <div 
            className="w-full py-4 flex justify-center cursor-grab active:cursor-grabbing touch-pan-y"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        <div className="flex-grow overflow-y-auto px-5 pb-20 hide-scrollbar">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-2 z-10">
                <h3 className="font-bold text-gray-800 text-lg font-display">
                    {selectedProductId ? 'Route Selected' : `${approvedProducts.length} Results`}
                </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
                {selectedProductId ? (
                    // Selected Item View
                    (() => {
                        const p = products.find(prod => prod.id === selectedProductId);
                        if (!p) return null;
                        const v = vendors.find(vend => vend.vendorId === p.vendorId);
                        return (
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 shadow-sm animate-fade-in">
                                <div className="flex gap-4">
                                    <img src={p.images[0]} className="w-20 h-20 rounded-xl object-cover" />
                                    <div>
                                        <h4 className="font-bold text-gray-900">{p.title}</h4>
                                        <p className="text-xs text-gray-500 mb-2">{v?.storeName} • {p.location}</p>
                                        <p className="font-bold text-primary">{p.currency}{p.price}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button fullWidth onClick={() => navigate(`/buyer/product/${p.id}`)}>View Product Details</Button>
                                    <Button variant="secondary" onClick={() => { setSelectedProductId(null); setIsDrawerOpen(true); }}>Back</Button>
                                </div>
                            </div>
                        );
                    })()
                ) : (
                    // List View
                    approvedProducts.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <p>No products found.</p>
                        </div>
                    ) : (
                        approvedProducts.map(product => {
                            const vendor = vendors.find(v => v.vendorId === product.vendorId);
                            return (
                                <div 
                                    key={product.id} 
                                    className="flex bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm active:scale-[0.98] transition-transform cursor-pointer hover:shadow-md" 
                                    onClick={() => handleProductSelect(product.id)}
                                >
                                    <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                                        <img src={product.images[0] || 'https://via.placeholder.com/80'} className="w-full h-full object-cover" alt={product.title} />
                                    </div>
                                    <div className="ml-3 flex-grow flex flex-col justify-center py-1">
                                        <h4 className="font-bold text-gray-900 line-clamp-1 text-sm font-display">{product.title}</h4>
                                        <p className="text-xs text-gray-500 mb-auto mt-1 line-clamp-1">{vendor?.storeName}</p>
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
                    )
                )}
            </div>
        </div>
      </div>
    </div>
  );
};