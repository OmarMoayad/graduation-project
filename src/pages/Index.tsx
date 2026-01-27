import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Store, 
  Boxes,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Shield,
  Zap,
  Globe,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  ShoppingBag,
  Star,
  Play,
  MousePointerClick,
  Rocket,
  Target,
  TrendingUp
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import VisitorChatBot from "@/components/VisitorChatBot";
import { getShopOrganization } from "@/lib/shop-config";
import InquiryForm from "@/components/InquiryForm";
import logo from "@/assets/logo.jpg";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { addToCart, totalItems } = useCart();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const isFeaturesInView = useInView(featuresRef, { once: true, margin: "-100px" });
  
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch active advertisements
  const { data: advertisements = [] } = useQuery({
    queryKey: ['advertisements'],
    queryFn: async () => {
      const shopOrg = await getShopOrganization();
      if (!shopOrg) return [];
      
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('organization_id', shopOrg.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch featured products
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const shopOrg = await getShopOrganization();
      if (!shopOrg) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sales_price, image_url, description')
        .eq('organization_id', shopOrg.id)
        .eq('is_active', true)
        .gt('sales_price', 0)
        .order('created_at', { ascending: false })
        .limit(8);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Auto-rotate ads
  useEffect(() => {
    if (advertisements.length > 1) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % advertisements.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [advertisements.length]);

  const handleAddToCart = (product: { id: string; name: string; sales_price: number | null; image_url: string | null }) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.sales_price || 0,
      image_url: product.image_url,
    });
    toast.success(isRTL ? `تمت إضافة ${product.name} إلى السلة` : `${product.name} added to cart`);
  };

  const features = [
    {
      icon: Package,
      title: t("landing.features.inventory.title"),
      description: t("landing.features.inventory.description"),
      gradient: "from-blue-500 to-cyan-500",
      delay: 0
    },
    {
      icon: ShoppingCart,
      title: t("landing.features.pos.title"),
      description: t("landing.features.pos.description"),
      gradient: "from-violet-500 to-purple-500",
      delay: 0.1
    },
    {
      icon: Store,
      title: t("landing.features.multiLocation.title"),
      description: t("landing.features.multiLocation.description"),
      gradient: "from-orange-500 to-amber-500",
      delay: 0.2
    },
    {
      icon: Users,
      title: t("landing.features.purchase.title"),
      description: t("landing.features.purchase.description"),
      gradient: "from-emerald-500 to-green-500",
      delay: 0.3
    },
    {
      icon: Boxes,
      title: t("landing.features.lot.title"),
      description: t("landing.features.lot.description"),
      gradient: "from-pink-500 to-rose-500",
      delay: 0.4
    },
    {
      icon: BarChart3,
      title: t("landing.features.analytics.title"),
      description: t("landing.features.analytics.description"),
      gradient: "from-indigo-500 to-blue-500",
      delay: 0.5
    }
  ];

  const stats = [
    { value: "99.9%", label: t("landing.stats.uptime"), icon: TrendingUp },
    { value: "500+", label: t("landing.stats.businesses"), icon: Users },
    { value: "24/7", label: t("landing.stats.support"), icon: Target },
    { value: "50K+", label: t("landing.stats.transactions"), icon: Rocket }
  ];

  const nextAd = () => {
    setCurrentAdIndex((prev) => (prev + 1) % advertisements.length);
  };

  const prevAd = () => {
    setCurrentAdIndex((prev) => (prev - 1 + advertisements.length) % advertisements.length);
  };

  // Floating animation variants
  const floatingAnimation = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const }
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background with more effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        
        {/* Animated gradient overlay */}
        <motion.div 
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 0% 0%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 100% 100%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 0% 100%, hsl(var(--accent) / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 100% 0%, hsl(var(--accent) / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 0% 0%, hsl(var(--primary) / 0.15) 0%, transparent 50%)",
            ]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Floating animated orbs with enhanced movement */}
        <motion.div 
          className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-r from-primary/20 to-accent/20 blur-[120px]"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ 
            top: '10%', 
            left: '20%',
          }}
        />
        <motion.div 
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-l from-accent/20 to-primary/20 blur-[100px]"
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{ 
            bottom: '20%', 
            right: '10%',
          }}
        />
        
        {/* Third orb for more depth */}
        <motion.div 
          className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-500/15 to-pink-500/15 blur-[80px]"
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          style={{ 
            top: '50%', 
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
        
        {/* Animated grid pattern with pulse */}
        <motion.div 
          className="absolute inset-0 opacity-[0.03]" 
          animate={{ opacity: [0.02, 0.05, 0.02] }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Enhanced floating particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/40"
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
            }}
          />
        ))}

        {/* Glowing lines */}
        <motion.div
          className="absolute h-px w-1/3 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
          animate={{
            x: ["-100%", "400%"],
            opacity: [0, 1, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{ top: "20%" }}
        />
        <motion.div
          className="absolute h-px w-1/4 bg-gradient-to-r from-transparent via-accent/50 to-transparent"
          animate={{
            x: ["400%", "-100%"],
            opacity: [0, 1, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 3 }}
          style={{ top: "60%" }}
        />
      </div>

      {/* Floating Header with blur on scroll */}
      <motion.header 
        className="fixed top-0 inset-x-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="mx-4 mt-4">
          <motion.div 
            className="bg-background/70 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg shadow-primary/5"
            whileHover={{ boxShadow: "0 20px 40px -10px hsl(var(--primary) / 0.2)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="container mx-auto px-6 py-3 flex items-center justify-between">
              <motion.div 
                className="flex items-center gap-3 group cursor-pointer" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <motion.img 
                    src={logo} 
                    alt="Remix Logo" 
                    className="w-11 h-11 rounded-xl shadow-lg shadow-primary/25"
                    whileHover={{ rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                  <motion.div 
                    className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity -z-10"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <span className="font-bold text-2xl bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-[gradient_3s_linear_infinite]">
                  Remix
                </span>
              </motion.div>
              
              <div className="flex items-center gap-3">
                <LanguageSwitcher variant="ghost" />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline" 
                    className="relative group overflow-hidden"
                    onClick={() => navigate("/shop")}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ShoppingBag className="h-5 w-5 me-2 group-hover:scale-110 transition-transform" />
                    {isRTL ? "المتجر" : "Shop"}
                    <AnimatePresence>
                      {totalItems > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                        >
                          <Badge className="absolute -top-2 -end-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                            {totalItems}
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
                <Button variant="ghost" onClick={() => navigate("/login")} className="hidden md:inline-flex">
                  {t("common.signIn")}
                </Button>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25 group relative overflow-hidden" 
                    onClick={() => navigate("/login")}
                  >
                    <motion.span 
                      className="absolute inset-0 bg-white/20"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.5 }}
                    />
                    <span className="relative">{t("landing.getStarted")}</span>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section with enhanced animations */}
      <motion.section 
        ref={heroRef}
        className="relative pt-32 pb-20 md:pt-44 md:pb-32"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto text-center">
            {/* Animated Badge */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 mb-8 px-6 py-3 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-full backdrop-blur-sm border border-primary/20 group hover:border-primary/40 transition-colors cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative">
                <Sparkles className="h-5 w-5 text-primary" />
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-5 w-5 text-primary opacity-50" />
                </motion.div>
              </div>
              <span className="text-primary font-semibold">{t("landing.badge")}</span>
              <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                <ArrowRight className="h-4 w-4 text-primary" />
              </motion.div>
            </motion.div>
            
            {/* Animated Title with stagger effect */}
            <motion.h1 
              className="text-5xl md:text-6xl lg:text-8xl font-bold mb-8 tracking-tight"
              initial={{ opacity: 0 }}
              animate={isHeroInView ? { opacity: 1 } : {}}
            >
              <motion.span 
                className="block"
                initial={{ opacity: 0, y: 50 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {t("landing.heroTitle1")}
              </motion.span>
              <motion.span 
                className="block bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 50 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 }}
                style={{ animation: "gradient 3s linear infinite" }}
              >
                {t("landing.heroTitle2")}
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {t("landing.heroSubtitle")}
            </motion.p>
            
            {/* Animated CTA Buttons */}
            <motion.div 
              className="flex flex-wrap gap-4 justify-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-lg shadow-primary/25 text-lg px-10 py-7 h-auto group relative overflow-hidden" 
                  onClick={() => navigate("/login")}
                >
                  <motion.span 
                    className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative flex items-center">
                    {t("landing.startTrial")}
                    <ArrowRight className="ms-2 h-5 w-5 group-hover:translate-x-2 rtl:group-hover:-translate-x-2 transition-transform" />
                  </span>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-10 py-7 h-auto border-2 hover:bg-muted/50 group" 
                  onClick={() => navigate("/login")}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Play className="me-2 h-5 w-5 text-primary" />
                  </motion.div>
                  {t("landing.watchDemo")}
                </Button>
              </motion.div>
            </motion.div>

            {/* Animated Trust Badges */}
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
              variants={staggerContainer}
              initial="hidden"
              animate={isHeroInView ? "show" : "hidden"}
            >
              {[
                { icon: Shield, text: t("landing.trustBadge1"), color: "text-emerald-500" },
                { icon: Zap, text: t("landing.trustBadge2"), color: "text-amber-500" },
                { icon: Globe, text: t("landing.trustBadge3"), color: "text-blue-500" }
              ].map((badge, i) => (
                <motion.div 
                  key={i}
                  variants={fadeInUp}
                  className="flex items-center gap-2 px-5 py-2.5 bg-background/50 backdrop-blur-sm rounded-full border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all group cursor-pointer"
                  whileHover={{ scale: 1.05, y: -3 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                  >
                    <badge.icon className={`h-5 w-5 ${badge.color}`} />
                  </motion.div>
                  <span className="font-medium">{badge.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Scroll indicator with enhanced animation */}
            <motion.div 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-muted-foreground"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <MousePointerClick className="h-5 w-5" />
              </motion.div>
              <span className="text-xs">{isRTL ? 'اكتشف المزيد' : 'Scroll to explore'}</span>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Advertisements Section with slide animation */}
      <AnimatePresence>
        {advertisements.length > 0 && (
          <motion.section 
            className="py-12 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="container mx-auto px-4">
              <motion.div 
                className="flex items-center justify-center gap-2 mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Megaphone className="h-5 w-5 text-primary" />
                </motion.div>
                <h2 className="text-xl font-bold text-center">{t("landing.advertisements")}</h2>
              </motion.div>
              
              <div className="max-w-4xl mx-auto relative">
                {/* Ad Content with slide animation */}
                <motion.div 
                  className="relative overflow-hidden rounded-2xl bg-card border shadow-xl"
                  whileHover={{ boxShadow: "0 25px 50px -12px hsl(var(--primary) / 0.25)" }}
                >
                  <AnimatePresence mode="wait">
                    {advertisements.map((ad, index) => (
                      index === currentAdIndex && (
                        <motion.div
                          key={ad.id}
                          initial={{ opacity: 0, x: 100 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.5 }}
                        >
                          <a 
                            href={ad.link_url || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <div className="flex flex-col md:flex-row items-center gap-6 p-6">
                              {ad.image_url && (
                                <motion.div 
                                  className="w-full md:w-1/3 flex-shrink-0"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <img 
                                    src={ad.image_url} 
                                    alt={isRTL ? (ad.title_ar || ad.title) : ad.title}
                                    className="w-full h-48 object-cover rounded-xl"
                                  />
                                </motion.div>
                              )}
                              <div className={`flex-1 ${!ad.image_url ? 'text-center' : ''}`}>
                                <h3 className="text-2xl font-bold mb-3 text-foreground">
                                  {isRTL ? (ad.title_ar || ad.title) : ad.title}
                                </h3>
                                {(ad.description || ad.description_ar) && (
                                  <p className="text-muted-foreground leading-relaxed">
                                    {isRTL ? (ad.description_ar || ad.description) : ad.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </a>
                        </motion.div>
                      )
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Navigation Arrows with animation */}
                {advertisements.length > 1 && (
                  <>
                    <motion.button
                      onClick={prevAd}
                      className="absolute start-0 top-1/2 -translate-y-1/2 -translate-x-4 rtl:translate-x-4 w-10 h-10 bg-background border shadow-lg rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </motion.button>
                    <motion.button
                      onClick={nextAd}
                      className="absolute end-0 top-1/2 -translate-y-1/2 translate-x-4 rtl:-translate-x-4 w-10 h-10 bg-background border shadow-lg rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </motion.button>
                  </>
                )}

                {/* Dots Indicator */}
                {advertisements.length > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {advertisements.map((_, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setCurrentAdIndex(index)}
                        className={`h-2.5 rounded-full transition-all ${
                          index === currentAdIndex 
                            ? 'bg-primary' 
                            : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                        }`}
                        animate={{ width: index === currentAdIndex ? 32 : 10 }}
                        whileHover={{ scale: 1.2 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Featured Products Section with stagger animation */}
      {featuredProducts.length > 0 && (
        <motion.section 
          className="py-16 bg-background"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="container mx-auto px-4">
            <motion.div 
              className="flex items-center justify-between mb-10"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Star className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {isRTL ? "منتجاتنا المميزة" : "Featured Products"}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {isRTL ? "اكتشف أحدث منتجاتنا" : "Discover our latest products"}
                  </p>
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/shop")}
                  className="group"
                >
                  {isRTL ? "عرض الكل" : "View All"}
                  <ArrowRight className="ms-2 h-4 w-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>

            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
            >
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  variants={fadeInUp}
                  whileHover={{ y: -10 }}
                >
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      {product.image_url ? (
                        <motion.img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <Package className="h-12 w-12 text-muted-foreground/50" />
                        </div>
                      )}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {product.description}
                        </p>
                      )}
                      <p className="text-lg font-bold text-primary mt-2">
                        ₪{(product.sales_price || 0).toFixed(2)}
                      </p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                          onClick={() => handleAddToCart(product)}
                        >
                          <ShoppingCart className="h-4 w-4 me-2" />
                          {isRTL ? "أضف للسلة" : "Add to Cart"}
                        </Button>
                      </motion.div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Shop CTA */}
            <motion.div 
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <motion.div 
                className="inline-flex items-center gap-4 p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl border border-primary/20"
                whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px hsl(var(--primary) / 0.2)" }}
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </motion.div>
                <div className="text-start">
                  <p className="font-semibold">
                    {isRTL ? "هل تريد المزيد من المنتجات؟" : "Want to see more products?"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? "تصفح متجرنا الكامل واكتشف عروضنا المميزة" : "Browse our full shop and discover amazing deals"}
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg"
                    onClick={() => navigate("/shop")}
                  >
                    {isRTL ? "تسوق الآن" : "Shop Now"}
                    <ArrowRight className="ms-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Stats Section with counter animation */}
      <motion.section 
        className="py-24 relative overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
        <motion.div 
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, hsl(var(--accent) / 0.1) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%)",
            ]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        
        <div className="container mx-auto px-4 relative">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center group p-6 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all"
                variants={fadeInUp}
                whileHover={{ y: -10, boxShadow: "0 25px 50px -12px hsl(var(--primary) / 0.25)" }}
              >
                <motion.div
                  className="mx-auto mb-4 w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <stat.icon className="h-6 w-6 text-primary" />
                </motion.div>
                <motion.div 
                  className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] bg-clip-text text-transparent mb-3"
                  style={{ animation: "gradient 3s linear infinite" }}
                  whileHover={{ scale: 1.1 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Grid with 3D hover */}
      <motion.section 
        ref={featuresRef}
        className="container mx-auto px-4 py-24 relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
            {isRTL ? 'مميزات قوية' : 'Powerful Features'}
          </motion.div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
            {t("landing.featuresTitle")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("landing.featuresSubtitle")}
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover={{ 
                y: -15,
                rotateX: 5,
                rotateY: isRTL ? 5 : -5,
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <Card className="group p-8 hover:shadow-2xl transition-all duration-500 border-border bg-background/50 backdrop-blur-sm hover:border-primary/30 relative overflow-hidden h-full">
                {/* Animated gradient border on hover */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-accent/0"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                <motion.div 
                  className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.5 }}
                />
                
                <motion.div 
                  className={`relative w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <feature.icon className="h-8 w-8 text-white" />
                  <motion.div 
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-2xl blur-xl`}
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 0.5 }}
                  />
                </motion.div>
                <h3 className="relative text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">{feature.title}</h3>
                <p className="relative text-muted-foreground leading-relaxed">{feature.description}</p>
                
                {/* Arrow indicator */}
                <motion.div 
                  className="mt-4 flex items-center text-primary"
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ opacity: 1, x: 0 }}
                >
                  <span className="text-sm font-medium">{isRTL ? 'اكتشف المزيد' : 'Learn more'}</span>
                  <ArrowRight className="h-4 w-4 ms-2" />
                </motion.div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Benefits Section with parallax */}
      <motion.section 
        className="relative py-24 bg-muted/30 overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div 
          className="absolute top-0 start-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-0 end-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{ 
            x: [0, -40, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
                  {t("landing.whyChooseTitle")}
                </h2>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  {t("landing.whyChooseSubtitle")}
                </p>
                
                <motion.div 
                  className="space-y-4"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                >
                  {[
                    t("landing.benefit1"),
                    t("landing.benefit2"),
                    t("landing.benefit3"),
                    t("landing.benefit4")
                  ].map((benefit, index) => (
                    <motion.div 
                      key={index} 
                      className="flex items-center gap-3 group"
                      variants={fadeInUp}
                      whileHover={{ x: isRTL ? -10 : 10 }}
                    >
                      <motion.div 
                        className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25"
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </motion.div>
                      <span className="text-foreground font-medium">{benefit}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
              
              <motion.div 
                className="relative"
                initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <Card className="relative p-8 bg-card/80 backdrop-blur border-2 border-primary/20 shadow-2xl">
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { icon: Package, label: t("inventory.title"), color: "from-primary/10 to-primary/5", iconColor: "text-primary" },
                      { icon: ShoppingCart, label: t("pos.title"), color: "from-accent/10 to-accent/5", iconColor: "text-accent" },
                      { icon: Users, label: t("contacts.title"), color: "from-emerald-500/10 to-emerald-500/5", iconColor: "text-emerald-500" },
                      { icon: BarChart3, label: t("reports.title"), color: "from-amber-500/10 to-amber-500/5", iconColor: "text-amber-500" }
                    ].map((item, index) => (
                      <motion.div 
                        key={index}
                        className={`p-6 bg-gradient-to-br ${item.color} rounded-xl text-center cursor-pointer`}
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <item.icon className={`h-8 w-8 mx-auto mb-3 ${item.iconColor}`} />
                        </motion.div>
                        <div className="font-semibold">{item.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section with enhanced effects */}
      <motion.section 
        className="container mx-auto px-4 py-24"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
          >
            <Card className="relative overflow-hidden p-12 md:p-16 bg-gradient-to-br from-primary via-primary to-accent border-0 shadow-2xl shadow-primary/25">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTZWMGg2djMwem0tNiAwSDB2NmgzMHYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
              
              {/* Animated orbs */}
              <motion.div 
                className="absolute top-0 end-0 w-80 h-80 bg-white/10 rounded-full blur-3xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              <motion.div 
                className="absolute bottom-0 start-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.1, 0.2]
                }}
                transition={{ duration: 6, repeat: Infinity }}
              />
              
              <div className="relative z-10 text-center">
                <motion.h2 
                  className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  {t("landing.ctaTitle")}
                </motion.h2>
                <motion.p 
                  className="text-white/90 text-lg mb-10 max-w-2xl mx-auto leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  {t("landing.ctaSubtitle")}
                </motion.p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg" 
                    className="bg-white text-primary hover:bg-white/90 shadow-xl text-base px-10 py-6 h-auto font-semibold group" 
                    onClick={() => navigate("/login")}
                  >
                    {t("landing.startTrial")}
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ArrowRight className="ms-2 h-5 w-5" />
                    </motion.div>
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        className="border-t border-border py-12 bg-muted/20"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Package className="h-4 w-4 text-white" />
              </motion.div>
              <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Remix</span>
            </motion.div>
            <p className="text-muted-foreground text-sm">
              © 2025 Remix. {t("landing.allRightsReserved")}
            </p>
          </div>
        </div>
      </motion.footer>
      
      {/* Inquiry Form */}
      <InquiryForm />
      
      {/* Visitor ChatBot */}
      <VisitorChatBot />
    </div>
  );
};

export default Index;
