import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, fileContent } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('ai-reports: missing Authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized: missing token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Use the publishable key in Lovable Cloud
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ??
      '';

    if (!supabaseUrl || !supabaseKey) {
      console.error('ai-reports: missing Supabase credentials', {
        hasUrl: Boolean(supabaseUrl),
        hasServiceRole: Boolean(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')),
        hasPublishable: Boolean(Deno.env.get('SUPABASE_PUBLISHABLE_KEY')),
      });
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: missing Supabase credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user's organization
    const jwt = authHeader.replace('Bearer ', '').trim();
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    console.log('ai-reports: getUser', { userId: user?.id, userError });
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      throw new Error('No organization found');
    }

    const organizationId = profile.organization_id;

    // Define tools for the AI to query the database
const tools = [
      {
        type: "function",
        function: {
          name: "get_all_products",
          description: "Get list of all products with names and prices. Use this when user asks for product names or product list.",
          parameters: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Number of products to return, default 10" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_top_products",
          description: "Get top selling products by quantity sold. Returns product names and quantities.",
          parameters: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Number of products to return, default 5" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_inventory_summary",
          description: "Get summary of inventory including total products, warehouses, locations, and categories.",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_contact_stats",
          description: "Get statistics about contacts including customers, vendors, and total contacts.",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_warehouse_utilization",
          description: "Get warehouse utilization showing which warehouses have the most products.",
          parameters: {
            type: "object",
            properties: {}
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_low_stock_products",
          description: "Get products that are below their reorder point.",
          parameters: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Number of products to return, default 10" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_cheapest_products",
          description: "Get the cheapest products by sales price.",
          parameters: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Number of products to return, default 5" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_most_expensive_products",
          description: "Get the most expensive products by sales price.",
          parameters: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Number of products to return, default 5" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_products_by_price_range",
          description: "Get products within a specific price range. Use for questions like 'products above 50' or 'products between 10 and 100'.",
          parameters: {
            type: "object",
            properties: {
              min_price: { type: "number", description: "Minimum price, default 0" },
              max_price: { type: "number", description: "Maximum price, default 999999" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "get_product_details",
          description: "Get detailed information about a specific product by name or SKU.",
          parameters: {
            type: "object",
            properties: {
              search_term: { type: "string", description: "Product name or SKU to search for" }
            },
            required: ["search_term"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyze_uploaded_file",
          description: "Analyze uploaded file content (CSV, JSON) to answer questions about products, prices, etc.",
          parameters: {
            type: "object",
            properties: {
              filter_type: { type: "string", description: "Type of filter to apply: price_above, price_below, category, name_contains" },
              filter_value: { type: "string", description: "Value for the filter" }
            }
          }
        }
      }
    ];

    // Call Lovable AI with tools
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `أنت صديق ومساعد ذكي لتحليل بيانات الأعمال. تتحدث بطريقة ودية وطبيعية مثل الإنسان.

🎯 شخصيتك:
- أنت ودود ومتفهم وتستخدم لغة بسيطة يفهمها الجميع
- تفهم اللهجات العربية المختلفة (شامي، خليجي، مصري، إلخ)
- تستخدم تعبيرات طبيعية مثل "تمام!"، "أكيد!"، "ممتاز!"، "طيب خلينا نشوف..."
- لا تتحدث بطريقة آلية أو رسمية جداً

🧠 فهم اللغة الطبيعية:
- "بدي" / "ابغى" / "عايز" / "أريد" = أريد
- "شو" / "إيش" / "ايه" / "ما هو" = ماذا
- "كيف" / "ازاي" / "شلون" = كيف
- "وين" / "فين" / "أين" = أين
- "كم" / "قديش" / "كام" = كم
- "أغلى شي" / "أعلى سعر" = أغلى المنتجات
- "أرخص شي" / "أقل سعر" = أرخص المنتجات
- "مبيعات" / "اللي ماشي" / "اللي يبيع" = المنتجات الأكثر مبيعاً
- "مخزون قليل" / "خلص" / "فاضي" = منتجات مخزونها منخفض
- "كل المنتجات" / "جيب كلشي" / "عرض الكل" = قائمة المنتجات

⚡ قواعد التنفيذ:
1. نفذ الطلب فوراً - لا تسأل أسئلة توضيحية
2. إذا لم يحدد عدد، استخدم 5 كافتراضي
3. استخدم الأدوات مباشرة للحصول على البيانات
4. أجب بنفس لغة ولهجة المستخدم

أمثلة على الفهم:
- "شو عندي منتجات؟" → get_all_products
- "كم سعر الأرز؟" → get_product_details مع search_term="أرز"
- "بدي أشوف شو اللي مبيعاته عالية" → get_top_products
- "فيه شي سعره فوق 100؟" → get_products_by_price_range مع min_price=100
- "عطيني فكرة عن المخزون" → get_inventory_summary`
          },
          { role: 'user', content: fileContent ? `${query}\n\nFile content:\n${fileContent}` : query }
        ],
        tools: tools,
        tool_choice: 'required'
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    // Check if AI wants to call a tool
    const message = aiData.choices[0].message;
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log('Function call:', functionName, functionArgs);

      let toolResult: any;

      // Execute the requested function
switch (functionName) {
        case 'get_all_products': {
          const { data: products } = await supabase
            .from('products')
            .select('name, sku, sales_price, cost_price')
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .order('name', { ascending: true })
            .limit(functionArgs.limit || 10);

          toolResult = { 
            products: (products || []).map(p => ({
              name: p.name,
              sku: p.sku,
              price: p.sales_price
            })),
            count: products?.length || 0 
          };
          break;
        }

        case 'get_top_products': {
          const { data: stockMoves } = await supabase
            .from('stock_moves')
            .select('product_id, quantity')
            .eq('organization_id', organizationId)
            .eq('move_type', 'out');

          // Aggregate by product id
          const totals = new Map<string, number>();
          (stockMoves || []).forEach((m: any) => {
            const pid = m.product_id as string | null;
            if (!pid) return;
            totals.set(pid, (totals.get(pid) || 0) + Number(m.quantity || 0));
          });

          const ids = Array.from(totals.keys());
          let nameById: Record<string, string> = {};
          if (ids.length) {
            const { data: prodRows } = await supabase
              .from('products')
              .select('id, name')
              .in('id', ids);
            (prodRows || []).forEach((p: any) => { nameById[p.id] = p.name; });
          }

          const topProducts = ids
            .map((id) => ({ name: nameById[id] || 'Unknown', quantity: totals.get(id) || 0 }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, functionArgs.limit || 5);

          toolResult = { top_products: topProducts };
          break;
        }

        case 'get_inventory_summary': {
          const [products, warehouses, locations, categories] = await Promise.all([
            supabase.from('products').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
            supabase.from('warehouses').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
            supabase.from('locations').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId),
            supabase.from('product_categories').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId)
          ]);

          toolResult = {
            total_products: products.count || 0,
            total_warehouses: warehouses.count || 0,
            total_locations: locations.count || 0,
            total_categories: categories.count || 0
          };
          break;
        }

        case 'get_contact_stats': {
          const { data: contacts } = await supabase
            .from('contacts')
            .select('is_customer, is_vendor')
            .eq('organization_id', organizationId);

          const customers = contacts?.filter(c => c.is_customer).length || 0;
          const vendors = contacts?.filter(c => c.is_vendor).length || 0;

          toolResult = {
            total_contacts: contacts?.length || 0,
            customers,
            vendors
          };
          break;
        }

        case 'get_warehouse_utilization': {
          const { data: warehouses } = await supabase
            .from('warehouses')
            .select('id, name')
            .eq('organization_id', organizationId);

          const utilizationData = await Promise.all(
            (warehouses || []).map(async (warehouse) => {
              const { data: locations } = await supabase
                .from('locations')
                .select('id')
                .eq('warehouse_id', warehouse.id);

              const locationIds = locations?.map(l => l.id) || [];
              
              if (locationIds.length === 0) {
                return { warehouse_name: warehouse.name, product_count: 0 };
              }

              const { data: quants } = await supabase
                .from('stock_quants')
                .select('product_id')
                .in('location_id', locationIds)
                .gt('quantity', 0);

              const uniqueProducts = new Set(quants?.map(q => q.product_id) || []);
              
              return {
                warehouse_name: warehouse.name,
                product_count: uniqueProducts.size
              };
            })
          );

          toolResult = { warehouses: utilizationData };
          break;
        }

        case 'get_low_stock_products': {
          const { data: products } = await supabase
            .from('products')
            .select('id, name, sku, reorder_point, reorder_quantity')
            .eq('organization_id', organizationId)
            .gt('reorder_point', 0);

          const lowStockProducts = [];
          for (const product of products || []) {
            const { data: quants } = await supabase
              .from('stock_quants')
              .select('quantity')
              .eq('product_id', product.id)
              .eq('organization_id', organizationId);

            const totalStock = quants?.reduce((sum, q) => sum + Number(q.quantity), 0) || 0;

            if (totalStock <= Number(product.reorder_point)) {
              lowStockProducts.push({
                name: product.name,
                sku: product.sku,
                current_stock: totalStock,
                reorder_point: product.reorder_point,
                reorder_quantity: product.reorder_quantity
              });
            }
          }

          toolResult = {
            low_stock_products: lowStockProducts.slice(0, functionArgs.limit || 10)
          };
          break;
        }

        case 'get_cheapest_products': {
          const { data: products } = await supabase
            .from('products')
            .select('name, sku, sales_price, cost_price')
            .eq('organization_id', organizationId)
            .gt('sales_price', 0)
            .order('sales_price', { ascending: true })
            .limit(functionArgs.limit || 5);

          toolResult = { cheapest_products: products || [] };
          break;
        }

        case 'get_most_expensive_products': {
          const { data: products } = await supabase
            .from('products')
            .select('name, sku, sales_price, cost_price')
            .eq('organization_id', organizationId)
            .order('sales_price', { ascending: false })
            .limit(functionArgs.limit || 5);

          toolResult = { most_expensive_products: products || [] };
          break;
        }

        case 'get_products_by_price_range': {
          const { data: products } = await supabase
            .from('products')
            .select('name, sku, sales_price, cost_price')
            .eq('organization_id', organizationId)
            .gte('sales_price', functionArgs.min_price)
            .lte('sales_price', functionArgs.max_price)
            .order('sales_price', { ascending: true });

          toolResult = { 
            products_in_range: products || [],
            count: products?.length || 0
          };
          break;
        }

        case 'get_product_details': {
          const searchTerm = functionArgs.search_term.toLowerCase();
          const { data: products } = await supabase
            .from('products')
            .select('name, sku, barcode, sales_price, cost_price, product_type, uom, reorder_point, reorder_quantity, description')
            .eq('organization_id', organizationId)
            .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);

          // Get stock levels for found products
          const enrichedProducts = await Promise.all(
            (products || []).map(async (product) => {
              const { data: quants } = await supabase
                .from('stock_quants')
                .select('quantity')
                .eq('product_id', (await supabase
                  .from('products')
                  .select('id')
                  .eq('sku', product.sku)
                  .eq('organization_id', organizationId)
                  .single()).data?.id || '');

              const totalStock = quants?.reduce((sum, q) => sum + Number(q.quantity), 0) || 0;

              return {
                ...product,
                current_stock: totalStock
              };
            })
          );

          toolResult = { 
            products: enrichedProducts,
            count: enrichedProducts.length
          };
          break;
        }

        case 'analyze_uploaded_file': {
          if (!fileContent) {
            toolResult = { error: 'No file uploaded', message: 'يرجى رفع ملف للتحليل' };
            break;
          }

          try {
            // Try to parse as JSON
            let parsedData: any[] = [];
            
            if (fileContent.trim().startsWith('[') || fileContent.trim().startsWith('{')) {
              const jsonData = JSON.parse(fileContent);
              parsedData = Array.isArray(jsonData) ? jsonData : [jsonData];
            } else {
              // Parse as CSV
              const lines = fileContent.trim().split('\n');
              const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
              
              for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map((v: string) => v.trim().replace(/"/g, ''));
                const row: any = {};
                headers.forEach((header: string, index: number) => {
                  row[header] = values[index];
                });
                parsedData.push(row);
              }
            }

            // Apply filters based on filter_type
            const filterType = functionArgs.filter_type;
            const filterValue = functionArgs.filter_value;

            let filteredData = parsedData;

            if (filterType && filterValue) {
              switch (filterType) {
                case 'price_above':
                  filteredData = parsedData.filter((item: any) => {
                    const price = parseFloat(item.price || item.sales_price || item.سعر || item.السعر || 0);
                    return price > parseFloat(filterValue);
                  });
                  break;
                case 'price_below':
                  filteredData = parsedData.filter((item: any) => {
                    const price = parseFloat(item.price || item.sales_price || item.سعر || item.السعر || 0);
                    return price < parseFloat(filterValue);
                  });
                  break;
                case 'category':
                  filteredData = parsedData.filter((item: any) => {
                    const category = (item.category || item.type || item.نوع || item.الفئة || '').toLowerCase();
                    return category.includes(filterValue.toLowerCase());
                  });
                  break;
                case 'name_contains':
                  filteredData = parsedData.filter((item: any) => {
                    const name = (item.name || item.product_name || item.اسم || item.المنتج || '').toLowerCase();
                    return name.includes(filterValue.toLowerCase());
                  });
                  break;
              }
            }

            toolResult = {
              total_items: parsedData.length,
              filtered_items: filteredData.length,
              data: filteredData.slice(0, 20) // Limit to 20 items
            };
          } catch (e) {
            toolResult = { error: 'Failed to parse file', message: 'تعذر قراءة الملف' };
          }
          break;
        }

        default:
          toolResult = { error: 'Unknown function' };
      }

      console.log('Tool result:', JSON.stringify(toolResult, null, 2));

      // Send tool result back to AI for final response
const finalResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            {
              role: 'system',
content: `أنت صديق ومساعد ذكي. قدم الإجابة بطريقة ودية وطبيعية.

💵 العملة الرسمية:
- العملة المستخدمة في النظام هي الشيقل الإسرائيلي (₪)
- دائماً اعرض الأسعار بالشيقل مع رمز ₪
- مثال: ₪55 أو 55 شيقل

🎨 أسلوب الإجابة:
- ابدأ بجملة ودية قصيرة مثل "تمام!"، "أكيد!"، "هيا البيانات:"، "طيب شوف..."
- استخدم الإيموجي بشكل معتدل لجعل الإجابة حيوية 📊 💰 📦 ⭐
- قدم البيانات بشكل قائمة مرقمة واضحة ومنظمة
- أضف ملخص قصير في النهاية إذا كان مناسباً

📝 تنسيق الإجابة:
- اسم المنتج بخط واضح
- السعر بالشيقل (₪) دائماً
- الكمية إذا كانت متاحة
- استخدم الترقيم (1. 2. 3.)

🎯 قواعد مهمة:
- أجب بنفس لغة ولهجة السؤال
- لا تضع JSON أو أكواد أبداً
- لا تسأل أسئلة إضافية
- كن مختصراً لكن واضح

مثال جيد:
"تمام! 🎯 هذي أكثر 5 منتجات مبيعاً عندك:

1. 📦 أرز بسمتي - ₪55 - 50 وحدة مباعة
2. 📦 زيت زيتون - ₪42 - 45 وحدة
3. 📦 حمص جبريني - ₪18 - 40 وحدة

ممتاز! المبيعات ماشية تمام 👍"`
            },
            { role: 'user', content: query },
            message,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult)
            }
          ]
        }),
      });

      const finalData = await finalResponse.json();
      const answer = finalData.choices[0].message.content;

      return new Response(
        JSON.stringify({ answer, data: toolResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no tool call, return the direct response
    const answer = message.content;
    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-reports:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
