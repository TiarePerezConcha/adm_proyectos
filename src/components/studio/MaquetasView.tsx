import React, { useState } from 'react';
import { Monitor, Smartphone, ShoppingBag, ArrowRight, Eye, Check, RefreshCw, Layers, ShieldCheck, Truck, CreditCard, ChevronRight, Package, Search } from 'lucide-react';
import { AppState } from '../../utils/storage';

interface MaquetasViewProps {
  state: AppState;
}

type Viewport = 'desktop' | 'mobile';
type ProjectSegment = 'ecommerce_moda' | 'gestion_stock' | 'b2b_servicios';

export const MaquetasView: React.FC<MaquetasViewProps> = ({ state }) => {
  const branding = state.brandingProjects[0];
  const brief = state.briefs[0];

  const [segment, setSegment] = useState<ProjectSegment>('ecommerce_moda');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [activeScreen, setActiveScreen] = useState<'home' | 'producto' | 'carrito' | 'checkout' | 'stock'>('home');

  // E-commerce interactive product state
  const [selectedSize, setSelectedSize] = useState('38');
  const [selectedColor, setSelectedColor] = useState('Denim Clásico');
  const [cartCount, setCartCount] = useState(1);
  const [selectedRegion, setSelectedRegion] = useState('rm');

  // Stock interactive state for Backoffice
  const [stockItems, setStockItems] = useState([
    { code: 'MB-001', name: 'Jeans Flare Tiro Alto', size: '38', stock: 45, priceCLP: 34990, status: 'Disponible' },
    { code: 'MB-002', name: 'Jeans Skinny Push Up', size: '36', stock: 12, priceCLP: 32990, status: 'Bajo Stock' },
    { code: 'MB-003', name: 'Mom Jeans Vintage Denim', size: '40', stock: 68, priceCLP: 36990, status: 'Disponible' },
    { code: 'MB-004', name: 'Wide Leg Celeste Lavado', size: '42', stock: 4, priceCLP: 38990, status: 'Crítico' },
  ]);

  const winningLogo = branding.logos.find((l) => l.id === branding.winningLogoId) || branding.logos[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight flex items-center gap-2">
            <Monitor className="w-6 h-6 text-[#DD8396]" />
            Maquetas Interactivas de Alta Fidelidad
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generadas con IA usando el Brief UX y Design System del proyecto. Modulares y adaptables al rubro.
          </p>
        </div>

        {/* Viewport & Segment Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Segment Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => {
                setSegment('ecommerce_moda');
                setActiveScreen('home');
              }}
              className={`px-3 py-1 rounded-md transition-all ${
                segment === 'ecommerce_moda' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              E-Commerce Tienda
            </button>
            <button
              onClick={() => {
                setSegment('gestion_stock');
                setActiveScreen('stock');
              }}
              className={`px-3 py-1 rounded-md transition-all ${
                segment === 'gestion_stock' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              Gestión Interna / Stock
            </button>
          </div>

          {/* Viewport Switcher Desktop vs Mobile */}
          <div className="flex items-center bg-slate-900 text-white p-1 rounded-lg text-xs font-semibold shadow-sm">
            <button
              onClick={() => setViewport('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                viewport === 'desktop' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop (1440px)</span>
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                viewport === 'mobile' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Móvil (375px)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Screen Navigation Tabs (matching screenshots) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold">
        {segment === 'ecommerce_moda' && (
          <>
            <button
              onClick={() => setActiveScreen('home')}
              className={`px-4 py-2 rounded-xl border transition-all ${
                activeScreen === 'home'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              1. Homepage (Tienda)
            </button>
            <button
              onClick={() => setActiveScreen('producto')}
              className={`px-4 py-2 rounded-xl border transition-all ${
                activeScreen === 'producto'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              2. Ficha de Producto (Selector Tallas)
            </button>
            <button
              onClick={() => setActiveScreen('carrito')}
              className={`px-4 py-2 rounded-xl border transition-all ${
                activeScreen === 'carrito'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              3. Carrito con Envíos Chile ({cartCount})
            </button>
            <button
              onClick={() => setActiveScreen('checkout')}
              className={`px-4 py-2 rounded-xl border transition-all ${
                activeScreen === 'checkout'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              4. Checkout Seguro Webpay
            </button>
          </>
        )}

        {segment === 'gestion_stock' && (
          <button
            onClick={() => setActiveScreen('stock')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white border border-slate-900 shadow-sm"
          >
            Dashboard de Stock & Inventario ERP
          </button>
        )}
      </div>

      {/* Mockup Canvas Container */}
      <div className="flex justify-center p-4 bg-slate-100 rounded-3xl border border-slate-200 overflow-x-auto min-h-[700px]">
        <div
          className={`bg-white shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden border border-slate-300 flex flex-col ${
            viewport === 'mobile' ? 'w-[375px] my-4' : 'w-full max-w-[1100px]'
          }`}
        >
          {/* Mockup Top Browser Bar */}
          <div className="bg-slate-900 text-slate-400 px-4 py-2.5 flex items-center justify-between text-[11px] font-mono border-b border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span className="ml-2 text-slate-300">
                {segment === 'ecommerce_moda' ? 'https://mbjeans.cl' : 'https://admin.mbjeans.cl/stock'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded">
                SSL Activo (200 OK)
              </span>
            </div>
          </div>

          {/* SCREEN 1: HOMEPAGE (Exact match to reference screenshots) */}
          {segment === 'ecommerce_moda' && activeScreen === 'home' && (
            <div className="flex-1 flex flex-col text-slate-800">
              {/* Promo Banner Top */}
              <div className="bg-[#1F3A5F] text-white text-[11px] text-center py-2 font-medium">
                Envíos gratis a todo Chile en compras sobre $45.000 &bull; Cambios de talla sin costo
              </div>

              {/* Navigation Bar with Logo */}
              <header className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div className="w-32 h-10" dangerouslySetInnerHTML={{ __html: winningLogo.svgCode }} />
                <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-700">
                  <span className="text-[#DD8396] cursor-pointer">Inicio</span>
                  <span className="hover:text-black cursor-pointer">Catálogo</span>
                  <span className="hover:text-black cursor-pointer">Novedades</span>
                  <span className="hover:text-black cursor-pointer">Guía de Tallas</span>
                  <span className="hover:text-black cursor-pointer">Sobre Nosotros</span>
                </nav>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    onClick={() => setActiveScreen('carrito')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF8F0] border border-[#F3CED6] rounded-full text-slate-800 font-bold text-xs hover:bg-[#F3CED6]/50 transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#DD8396]" />
                    <span>({cartCount})</span>
                  </button>
                </div>
              </header>

              {/* Hero Banner (Matching screenshots: Jeans que te hacen sentir increíble) */}
              <section className="bg-[#FFF8F0] px-8 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="max-w-md space-y-4">
                  <span className="text-[11px] font-bold text-[#DD8396] uppercase tracking-widest block font-mono">
                    Nueva Colección 2026
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F3A5F] leading-tight">
                    Jeans que te hacen sentir <span className="text-[#DD8396] italic">increíble</span>
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Diseñados con calce ergonómico y tela premium stretch que modela la figura femenina con total comodidad.
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={() => setActiveScreen('producto')}
                      className="px-6 py-3 bg-[#DD8396] hover:bg-[#c96f83] text-white font-bold rounded-xl text-xs shadow-md transition-colors"
                    >
                      Ver Modelo Destacado &rarr;
                    </button>
                  </div>
                </div>

                {/* Hero Product Visual Preview */}
                <div className="w-full md:w-80 h-72 bg-white rounded-2xl shadow-xl border border-[#F3CED6] p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="h-44 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs font-mono font-medium relative">
                    <span className="text-[#1F3A5F] font-serif font-bold text-base">MBJeans Premium Denim</span>
                    <span className="absolute top-2 right-2 bg-[#DD8396] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Tiro Alto
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">Jeans Flare Clásico</span>
                      <span className="text-[11px] text-[#DD8396] font-bold">$34.990 CLP</span>
                    </div>
                    <button
                      onClick={() => setActiveScreen('producto')}
                      className="text-xs font-bold text-[#1F3A5F] hover:underline"
                    >
                      Configurar &rarr;
                    </button>
                  </div>
                </div>
              </section>

              {/* Bestsellers Grid */}
              <section className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold font-serif text-slate-900">Bestsellers Más Vendidos</h3>
                    <span className="text-xs text-slate-500">Selección de prendas favoritas por mujeres en Chile</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'Flare Tiro Alto Indigo', price: 34990, tag: 'Bestseller' },
                    { name: 'Mom Jeans Celeste Retro', price: 36990, tag: 'Tendencia' },
                    { name: 'Skinny Deep Blue Push Up', price: 32990, tag: 'Favorito' },
                    { name: 'Wide Leg Lavado Claro', price: 38990, tag: 'Nuevo' },
                  ].map((p, i) => (
                    <div
                      key={i}
                      onClick={() => setActiveScreen('producto')}
                      className="border border-slate-200 rounded-xl p-3.5 space-y-2 hover:border-[#DD8396] cursor-pointer transition-all bg-white"
                    >
                      <div className="h-32 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 text-xs font-serif">
                        Prenda #{i + 1}
                      </div>
                      <span className="font-bold text-slate-900 text-xs block truncate">{p.name}</span>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#DD8396]">${p.price.toLocaleString('es-CL')}</span>
                        <span className="text-[10px] text-slate-400">Tallas 36-46</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Mid Season Sale Promo Section */}
              <section className="bg-[#1F3A5F] text-white p-8 rounded-2xl mx-8 my-4 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <span className="text-xs text-rose-300 font-mono uppercase tracking-widest font-bold">
                    MID SEASON SALE
                  </span>
                  <h3 className="text-2xl font-serif font-bold">Hasta 30% OFF en Jeans Seleccionados</h3>
                  <p className="text-xs text-slate-300">Aplica con cualquier medio de pago Webpay Plus o Débito.</p>
                </div>
                <button
                  onClick={() => setActiveScreen('producto')}
                  className="px-6 py-2.5 bg-white text-[#1F3A5F] font-bold rounded-xl text-xs hover:bg-slate-100 transition-colors shadow-md"
                >
                  Explorar Ofertas
                </button>
              </section>
            </div>
          )}

          {/* SCREEN 2: FICHA DE PRODUCTO CON SELECTOR DE TALLAS */}
          {segment === 'ecommerce_moda' && activeScreen === 'producto' && (
            <div className="p-8 space-y-8 text-slate-800 flex-1">
              <button
                onClick={() => setActiveScreen('home')}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium"
              >
                &larr; Volver al catálogo
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Images Gallery */}
                <div className="space-y-3">
                  <div className="w-full h-80 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-serif text-lg font-bold border border-slate-200">
                    Jeans Flare Tiro Alto - Vista Principal
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-20 bg-slate-50 rounded-lg border border-[#DD8396] flex items-center justify-center text-[10px] text-slate-500 font-mono">
                      Frente
                    </div>
                    <div className="h-20 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                      Espalda
                    </div>
                    <div className="h-20 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                      Detalle Botón
                    </div>
                  </div>
                </div>

                {/* Product Configuration */}
                <div className="space-y-5 text-xs">
                  <div>
                    <span className="text-[11px] text-[#DD8396] font-bold uppercase font-mono">MBJeans Denim Oficial</span>
                    <h2 className="text-2xl font-serif font-bold text-[#1F3A5F] mt-0.5">
                      Jeans Flare Tiro Alto Modelador
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xl font-bold text-slate-900 font-mono">$34.990 CLP</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                        Stock Disponible
                      </span>
                    </div>
                  </div>

                  {/* Selector de Tallas */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Seleccionar Talla (Chile):</span>
                      <span className="text-[#DD8396] hover:underline cursor-pointer text-[11px]">
                        Tabla de medidas en cm
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {['36', '38', '40', '42', '44', '46'].map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`w-10 h-10 rounded-lg font-bold font-mono transition-all text-xs ${
                            selectedSize === size
                              ? 'bg-slate-900 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector de Color */}
                  <div className="space-y-2">
                    <span className="font-bold text-slate-900">Tono de Denim: {selectedColor}</span>
                    <div className="flex items-center gap-2">
                      {['Denim Clásico', 'Azul Profundo', 'Celeste Lavado'].map((col) => (
                        <button
                          key={col}
                          onClick={() => setSelectedColor(col)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                            selectedColor === col
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CTA Add to cart */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => {
                        setCartCount(cartCount + 1);
                        setActiveScreen('carrito');
                      }}
                      className="w-full py-3.5 bg-[#DD8396] hover:bg-[#c96f83] text-white font-bold rounded-xl text-xs shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Agregar al Carrito &bull; $34.990 CLP</span>
                    </button>
                  </div>

                  {/* Benefits Accordion */}
                  <div className="border-t border-slate-200 pt-4 space-y-2 text-slate-600 text-[11px]">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span>Despacho a todo Chile por Starken y Chilexpress.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#1F3A5F]" />
                      <span>Garantía de cambio de talla sin costo de flete.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 3: CARRITO CON ENVÍO CHILE */}
          {segment === 'ecommerce_moda' && activeScreen === 'carrito' && (
            <div className="p-8 space-y-6 text-slate-800 flex-1">
              <h2 className="text-2xl font-serif font-bold text-slate-900">Tu Carrito de Compras</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                {/* Cart Items */}
                <div className="md:col-span-2 space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-slate-200 rounded-lg flex items-center justify-center font-bold text-xs">
                        MB
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">Jeans Flare Tiro Alto</span>
                        <span className="text-slate-500 text-[11px]">
                          Talla: {selectedSize} &bull; Color: {selectedColor}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">$34.990 CLP</span>
                  </div>
                </div>

                {/* Summary & Shipping Calculator */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                  <span className="font-bold text-slate-900 uppercase tracking-wider block text-xs">
                    Resumen del Pedido
                  </span>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Región de Envío (Chile):</label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white focus:outline-none"
                    >
                      <option value="rm">Región Metropolitana ($3.990 CLP)</option>
                      <option value="v">V Región de Valparaíso ($4.500 CLP)</option>
                      <option value="viii">VIII Región del Biobío ($5.200 CLP)</option>
                      <option value="sur">Regiones Australes ($6.900 CLP)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-200 pt-3 text-slate-600 font-mono">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>$34.990 CLP</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Envío:</span>
                      <span>${selectedRegion === 'rm' ? '3.990' : '4.990'} CLP</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-200">
                      <span>Total:</span>
                      <span>${(34990 + (selectedRegion === 'rm' ? 3990 : 4990)).toLocaleString('es-CL')} CLP</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveScreen('checkout')}
                    className="w-full py-3 bg-[#1F3A5F] hover:bg-[#152740] text-white font-bold rounded-xl text-xs shadow-md transition-colors"
                  >
                    Iniciar Pago Seguro &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 4: CHECKOUT SEGURO */}
          {segment === 'ecommerce_moda' && activeScreen === 'checkout' && (
            <div className="p-8 space-y-6 text-slate-800 flex-1 max-w-xl mx-auto">
              <div className="border-b border-slate-200 pb-4 text-center">
                <span className="font-serif text-xl font-bold text-[#1F3A5F]">MBJeans Checkout Seguro</span>
                <span className="text-xs text-slate-500 block mt-1">Conexión cifrada TLS 1.3 &bull; Transbank Webpay</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    defaultValue="Valentina Morales"
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">RUT para Boleta Electrónica</label>
                  <input
                    type="text"
                    defaultValue="18.765.432-1"
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dirección de Entrega</label>
                  <input
                    type="text"
                    defaultValue="Av. Providencia 1234, Depto 502, Santiago"
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                  />
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                  <div className="text-[11px] text-emerald-900">
                    <strong className="block">Webpay Plus (Redcompra / Débito / Crédito)</strong>
                    <span>Serás redirigido de forma segura al portal bancario oficial de Transbank.</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    alert('¡Simulación de compra completada con éxito! Boleta electrónica emitida.');
                    setActiveScreen('home');
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
                >
                  Pagar $38.980 CLP con Webpay
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 5: BACKOFFICE GESTIÓN DE STOCK / INVENTARIO ERP */}
          {segment === 'gestion_stock' && activeScreen === 'stock' && (
            <div className="p-8 space-y-6 text-slate-800 flex-1 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold font-sans text-slate-900">Panel de Control de Stock & Bodega</h2>
                  <p className="text-slate-500 text-xs font-sans">
                    Módulo de gestión interna para reposición, tallas y alertas de inventario crítico.
                  </p>
                </div>
                <button
                  onClick={() => alert('¡Inventario sincronizado con BBDD!')}
                  className="px-3.5 py-2 bg-slate-900 text-white font-sans font-bold rounded-lg text-xs"
                >
                  Sincronizar Stock
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px]">
                    <tr>
                      <th className="p-3.5">SKU / Código</th>
                      <th className="p-3.5">Prenda</th>
                      <th className="p-3.5">Talla</th>
                      <th className="p-3.5 text-right">Stock Físico</th>
                      <th className="p-3.5 text-right">Precio Venta</th>
                      <th className="p-3.5">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockItems.map((item) => (
                      <tr key={item.code} className="hover:bg-slate-50">
                        <td className="p-3.5 font-bold text-slate-900">{item.code}</td>
                        <td className="p-3.5 text-slate-700">{item.name}</td>
                        <td className="p-3.5 font-bold">{item.size}</td>
                        <td className="p-3.5 text-right font-bold text-slate-900">{item.stock} un.</td>
                        <td className="p-3.5 text-right">${item.priceCLP.toLocaleString('es-CL')}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.status === 'Disponible'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'Bajo Stock'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
