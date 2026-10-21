// Ported from the Claude Design file (design/project/Trinity Mark 360 App.dc.html).
// Demo data. Every key here is saved to the browser and synced across tabs.
export function seed() {
  return {
  projects:[
    {id:'PRJ-0231',name:'Lake Zone Roadshow',client:'Serengeti Telecom',pm:'SK',st:'on',prog:58,val:168,bud:116,spent:71.4,stage:9,due:'10 Oct',team:['SK','MM','JM','GM','AJ']},
    {id:'PRJ-0228',name:'Outlet Branding · 8 outlets',client:'Pwani Beverages',pm:'SK',st:'risk',prog:72,val:94,bud:62,spent:69.4,stage:10,due:'23 Sep',team:['SK','JM','AJ']},
    {id:'PRJ-0233',name:'Expo Stand 2026',client:'Mlimani Bank',pm:'NL',st:'late',prog:44,val:126,bud:88,spent:41.2,stage:7,due:'25 Sep',team:['NL','MM','AJ','JA']},
    {id:'PRJ-0226',name:'Product Activation',client:'Kivuko Foods',pm:'MM',st:'on',prog:86,val:58,bud:39,spent:31.8,stage:12,due:'30 Sep',team:['MM','JM','FH']},
    {id:'PRJ-0235',name:'Brand Launch Gala',client:'Safari Mobile',pm:'NL',st:'on',prog:18,val:210,bud:148,spent:12.6,stage:3,due:'14 Nov',team:['NL','SK','RT','RS']},
    {id:'PRJ-0219',name:'Staff Uniforms · 1,200 pcs',client:'Bahari Logistics',pm:'MM',st:'done',prog:100,val:42,bud:28,spent:26.1,stage:15,due:'12 Sep',team:['MM','JA']},
    {id:'PRJ-0230',name:'Billboard Campaign · 12 sites',client:'Kilimo Bank',pm:'SK',st:'risk',prog:51,val:132,bud:90,spent:58.3,stage:8,due:'06 Oct',team:['SK','AJ','GM','PL']},
    {id:'PRJ-0224',name:'Corporate Calendar 2027',client:'Nyota Insurance',pm:'RT',st:'on',prog:64,val:36,bud:22,spent:12.4,stage:7,due:'20 Oct',team:['RT','RS']}
  ],
  tasks:[
    {id:'T1',t:'Load display units + gazebo for Mwanza',p:'PRJ-0231',who:'AJ',due:'Today 14:00',st:'prog',pri:'high'},
    {id:'T2',t:'Confirm venue permits · Musoma & Bukoba',p:'PRJ-0231',who:'GM',due:'Today 17:00',st:'todo',pri:'high'},
    {id:'T3',t:'Crew briefing pack + brand guidelines',p:'PRJ-0231',who:'SK',due:'Wed 23',st:'review',pri:'med'},
    {id:'T4',t:'Print 2,000 Swahili flyers',p:'PRJ-0231',who:'JA',due:'Thu 24',st:'todo',pri:'med'},
    {id:'T5',t:'Install wall branding · outlets 4–8',p:'PRJ-0228',who:'JM',due:'Wed 23',st:'prog',pri:'high'},
    {id:'T6',t:'Order 2 extra vinyl rolls',p:'PRJ-0228',who:'FH',due:'Today',st:'todo',pri:'high'},
    {id:'T7',t:'Get 2 supplier quotes for stand print',p:'PRJ-0233',who:'NL',due:'Today 14:00',st:'prog',pri:'high'},
    {id:'T8',t:'Stand carpentry sign-off',p:'PRJ-0233',who:'MM',due:'Thu 24',st:'todo',pri:'med'},
    {id:'T9',t:'QC 400 branded T-shirts',p:'PRJ-0226',who:'MM',due:'Tue 22',st:'done',pri:'med'},
    {id:'T10',t:'Venue walkthrough · Serena ballroom',p:'PRJ-0235',who:'NL',due:'Fri 25',st:'todo',pri:'low'},
    {id:'T11',t:'Billboard site photos · 6 sites',p:'PRJ-0230',who:'GM',due:'Fri 25',st:'review',pri:'med'},
      {id:'T12',t:'Final artwork approval from client',p:'PRJ-0224',who:'RS',due:'Mon 28',st:'prog',pri:'low'},
    {id:'T13',t:'Collect roll-ups from store · SIN-0932',p:'PRJ-0231',who:'JM',due:'Today 07:30',st:'done',pri:'med'},
    {id:'T14',t:'Install wall branding · Kariakoo outlet 4 of 8',p:'PRJ-0228',who:'JM',due:'Today 08:00',st:'prog',pri:'high'},
    {id:'T15',t:'Check printing production · print floor',p:'PRJ-0233',who:'JM',due:'Today 10:00',st:'todo',pri:'med'},
    {id:'T16',t:'Deliver banners · Mikocheni',p:'PRJ-0226',who:'JM',due:'Today 14:00',st:'todo',pri:'med'}
  ],
  reqs:[
    {id:'REQ-0418',who:'JM',amt:300000,cat:'Transport',purpose:'Bajaji and daladala fares for a 6-person install crew, Mwanza activations Tue–Thu. The company van is on the Musoma run.',p:'PRJ-0231',need:'Today 12:00',step:4,st:'pending',log:['07:12','07:40','08:05','08:38']},
    {id:'REQ-0421',who:'NL',amt:2400000,cat:'Supplier deposit',purpose:'50% deposit to an outsourced printer for Mlimani stand graphics — our large-format printer is down.',p:'PRJ-0233',need:'Wed 23',step:4,st:'pending',log:['Mon 16:10','Mon 16:30','Mon 17:02','08:20']},
    {id:'REQ-0423',who:'GM',amt:180000,cat:'Permits',purpose:'Municipal venue permit fees · Musoma.',p:'PRJ-0231',need:'Thu 24',step:4,st:'pending',log:['Mon 11:02','Mon 12:15','Mon 14:40','08:31']},
    {id:'REQ-0425',who:'AJ',amt:450000,cat:'Fuel',purpose:'Fuel for T 119 DKL, Dar → Musoma round trip.',p:'PRJ-0231',need:'Thu 24',step:3,st:'pending',log:['07:50','08:02','08:26']},
    {id:'REQ-0426',who:'JM',amt:120000,cat:'Materials',purpose:'Adhesive and cleaning supplies for outlet installs.',p:'PRJ-0228',need:'Wed 23',step:1,st:'pending',log:['08:44']},
    {id:'REQ-0412',who:'GM',amt:250000,cat:'Transport',purpose:'Site visits for billboard photos.',p:'PRJ-0230',need:'Mon 21',step:6,st:'paid',log:['Fri 09:10','Fri 09:40','Fri 10:05','Fri 11:20','Fri 12:00','Fri 14:30']},
    {id:'REQ-0409',who:'AJ',amt:600000,cat:'Fuel',purpose:'Arusha delivery run.',p:'PRJ-0226',need:'Fri 18',step:6,st:'paid',log:['Thu','Thu','Thu','Thu','Thu','Fri']},
    {id:'REQ-0405',who:'SK',amt:90000,cat:'Meals',purpose:'Crew lunch — overtime.',p:'PRJ-0228',need:'Thu 17',step:2,st:'rejected',log:['Wed 18:00','Wed 18:20','Thu 08:10']}
  ],
  notes:[
    {id:1,ic:'banknote',t:'John M. requested TZS 300,000',s:'Lake Zone Roadshow · awaiting your approval',time:'08:42',read:false,go:'requests'},
    {id:2,ic:'alert',t:'Pwani outlet branding over budget by 12%',s:'Spent TZS 69.4M of 62.0M budget',time:'08:20',read:false,go:'project:PRJ-0228'},
    {id:3,ic:'users',t:'New website lead · Safari Mobile',s:'Road show, 6 regions',time:'07:58',read:false,go:'crm'},
    {id:4,ic:'package',t:'Low stock · Vinyl 1.37m gloss',s:'3 rolls left, minimum 10',time:'07:55',read:false,go:'store'},
    {id:5,ic:'clock',t:'4 staff missed yesterday\u2019s report',s:'Peter L., Rehema S., Juma A., Fatma H.',time:'07:00',read:false,go:'staff'},
    {id:6,ic:'check',t:'Production completed · 400 T-shirts',s:'Kivuko Foods · QC passed',time:'Mon',read:true,go:'project:PRJ-0226'}
  ],
  stock:[
    {sku:'VNL-137G',n:'Vinyl 1.37m gloss',cat:'Print media',q:3,min:10,u:'rolls',loc:'A-02',cost:185000},
    {sku:'VNL-137M',n:'Vinyl 1.37m matte',cat:'Print media',q:14,min:8,u:'rolls',loc:'A-03',cost:190000},
    {sku:'BNR-FLX',n:'Flex banner 3.2m',cat:'Print media',q:9,min:6,u:'rolls',loc:'A-05',cost:240000},
    {sku:'INK-ECO-C',n:'Eco-solvent ink · Cyan',cat:'Consumables',q:4,min:6,u:'L',loc:'B-01',cost:95000},
    {sku:'INK-ECO-K',n:'Eco-solvent ink · Black',cat:'Consumables',q:11,min:6,u:'L',loc:'B-01',cost:95000},
    {sku:'ADH-SPR',n:'Spray adhesive',cat:'Consumables',q:5,min:12,u:'cans',loc:'B-06',cost:18000},
    {sku:'TSH-WHT-L',n:'T-shirt white · L',cat:'Apparel',q:820,min:300,u:'pcs',loc:'C-10',cost:6500},
    {sku:'RLU-850',n:'Roll-up stand 85×200',cat:'Display',q:18,min:10,u:'pcs',loc:'D-04',cost:78000},
    {sku:'PVC-5MM',n:'Forex PVC board 5mm',cat:'Boards',q:40,min:20,u:'sheets',loc:'A-09',cost:52000},
    {sku:'GZB-3X3',n:'Gazebo tent 3×3',cat:'Equipment',q:6,min:4,u:'pcs',loc:'E-01',cost:420000}
  ],
  proc:[
    {id:'PR-0207',t:'Vinyl rolls × 12',p:'PRJ-0228',v:2.2,s:3,sup:'Chapa Supplies',sku:'VNL-137G',qty:12},
    {id:'PR-0209',t:'Stand graphics print (outsourced)',p:'PRJ-0233',v:4.8,s:1,sup:'PrintHub DSM'},
    {id:'PR-0210',t:'Eco-solvent ink × 8L',p:'',v:0.76,s:0,sup:'—',sku:'INK-ECO-C',qty:8},
    {id:'PR-0211',t:'Gazebo tents × 2',p:'PRJ-0235',v:0.84,s:2,sup:'Kariakoo Tents',sku:'GZB-3X3',qty:2},
    {id:'PR-0204',t:'Forex boards × 30',p:'PRJ-0230',v:1.56,s:4,sup:'Plastiko Ltd'},
    {id:'PR-0212',t:'Spray adhesive × 24',p:'PRJ-0228',v:0.43,s:0,sup:'—',sku:'ADH-SPR',qty:24},
    {id:'PR-0206',t:'Polo shirts × 300',p:'PRJ-0235',v:3.9,s:1,sup:'Mavazi Wear'}
  ],
  leads:[
    {id:'L1',c:'Safari Mobile',t:'Road show · 6 regions',v:185,s:0,src:'Website'},
    {id:'L2',c:'Serena Hotels',t:'Lobby & signage refresh',v:38,s:0,src:'Referral'},
    {id:'L3',c:'Nyota Insurance',t:'AGM 2026 production',v:64,s:1,src:'Existing client'},
    {id:'L4',c:'Zawadi Telecom',t:'Christmas activations',v:96,s:1,src:'Tender'},
    {id:'L5',c:'Kilimo Bank',t:'Branch rebrand · 18 branches',v:240,s:2,src:'Existing client'},
    {id:'L6',c:'Tumaini Beverages',t:'Sampling campaign',v:78,s:2,src:'Website'},
    {id:'L7',c:'Bahari Logistics',t:'Fleet wrap · 22 trucks',v:55,s:3,src:'Existing client'},
    {id:'L8',c:'Mlimani Bank',t:'Expo stand 2026',v:126,s:4,src:'Tender'}
  ],
  staff:[
    {k:'SK',role:'Project Manager',dept:'Projects',rep:true,fl:0},{k:'MM',role:'Operations Manager',dept:'Operations',rep:true,fl:0},{k:'NL',role:'Account Manager',dept:'Commercial',rep:true,fl:0},{k:'RT',role:'Finance Officer',dept:'Finance',rep:true,fl:0},{k:'JM',role:'Field Supervisor',dept:'Field',rep:true,fl:300000},{k:'GM',role:'Field Officer',dept:'Field',rep:true,fl:180000},{k:'AJ',role:'Driver',dept:'Logistics',rep:true,fl:450000},{k:'PL',role:'Installer',dept:'Field',rep:false,fl:250000},{k:'RS',role:'Graphic Designer',dept:'Creative',rep:false,fl:0},{k:'JA',role:'Printer Operator',dept:'Production',rep:false,fl:0},{k:'FH',role:'Storekeeper',dept:'Store',rep:false,fl:0}
  ],
  invoices:[
    {id:'INV-0187',c:'Kivuko Foods',p:'PRJ-0226',v:18.6,st:'overdue',due:'21 days late'},
    {id:'INV-0189',c:'Kilimo Bank',p:'PRJ-0230',v:22.6,st:'overdue',due:'9 days late'},
    {id:'INV-0192',c:'Pwani Beverages',p:'PRJ-0228',v:24.0,st:'sent',due:'30 Sep'},
    {id:'INV-0196',c:'Mlimani Bank',p:'PRJ-0233',v:63.0,st:'sent',due:'05 Oct'},
    {id:'INV-0197',c:'Safari Mobile',p:'PRJ-0235',v:58.2,st:'sent',due:'12 Oct'},
    {id:'INV-0195',c:'Serengeti Telecom',p:'PRJ-0231',v:84.0,st:'paid',due:'Paid 15 Sep'},
    {id:'INV-0198',c:'Nyota Insurance',p:'PRJ-0224',v:18.0,st:'draft',due:'—'}
  ],
  activity:[
    {time:'08:42',ic:'banknote',tone:'amber',t:'John M. requested TZS 300,000 for crew transport',s:'Lake Zone Roadshow · REQ-0418'},
    {time:'08:31',ic:'check',tone:'purple',t:'Sarah K. approved purchase request PR-0207',s:'Vinyl rolls × 12 · Pwani Beverages'},
    {time:'08:15',ic:'printer',tone:'green',t:'Production completed · 400 branded T-shirts',s:'Kivuko Foods Activation · QC passed'},
    {time:'07:58',ic:'users',tone:'blue',t:'New website lead · Safari Mobile',s:'Road show, 6 regions · assigned to Sales'},
    {time:'07:40',ic:'truck',tone:'dark',t:'Van T 482 DXY dispatched to Mwanza',s:'Driver Amani J. · 3 display units'}
  ],
  actions:[
    {d:'Pwani branding must complete Wednesday',a:'Add night shift on outlet installs',o:'MM',dl:'Wed 23 · 16:00',task:'TSK-1042'},
    {d:'Outsource Mlimani stand print',a:'Get 2 supplier quotes by 14:00',o:'NL',dl:'Today · 14:00',task:'TSK-1043'},
    {d:'Escalate Kivuko overdue invoice',a:'MD to call client finance lead',o:'DK',dl:'Tue 22 · 12:00',task:'TSK-1044'}
  ],
  agenda:[true,true,false,false,false,false],
  reportsSub:44, reportsToday:{}, reportText:'', fieldReq:{amt:'',purpose:'',p:'PRJ-0231',cat:'Transport'},
  proposals:[
    {id:'PRO-0152',c:'Zawadi Telecom',t:'Christmas activations · 4 regions',v:96,s:0,own:'NL',valid:'30 Oct'},
    {id:'PRO-0150',c:'Nyota Insurance',t:'AGM 2026 production',v:64,s:1,own:'NL',valid:'22 Oct'},
    {id:'PRO-0148',c:'Kilimo Bank',t:'Branch rebrand · 18 branches',v:240,s:3,own:'SK',valid:'15 Oct'},
    {id:'PRO-0147',c:'Tumaini Beverages',t:'Sampling campaign · 3 cities',v:78,s:4,own:'NL',valid:'12 Oct'},
    {id:'PRO-0145',c:'Bahari Logistics',t:'Fleet wrap · 22 trucks',v:55,s:5,own:'MM',valid:'08 Oct'},
    {id:'PRO-0141',c:'Safari Mobile',t:'Brand Launch Gala',v:210,s:6,own:'NL',valid:'—',conv:true}
  ],
  jobs:[
    {id:'JOB-0311',t:'Branded T-shirts × 600',p:'PRJ-0231',mat:'Cotton tees, DTF film',qty:600,s:3,due:'Thu 24',who:'JA',cost:3.9,waste:2},
    {id:'JOB-0312',t:'Roll-up banners × 24',p:'PRJ-0231',mat:'Roll-up 85×200, PET film',qty:24,s:6,due:'Mon 21',who:'JA',cost:1.9,waste:0},
    {id:'JOB-0313',t:'Truck wrap · 1 vehicle',p:'PRJ-0231',mat:'Cast vinyl + laminate',qty:1,s:2,due:'Fri 25',who:'RS',cost:2.4,waste:0},
    {id:'JOB-0314',t:'Expo stand graphics',p:'PRJ-0233',mat:'SEG fabric, Forex 5mm',qty:18,s:1,due:'Wed 23',who:'RS',cost:6.2,waste:0},
    {id:'JOB-0315',t:'Outlet wall branding · 8 walls',p:'PRJ-0228',mat:'Vinyl 1.37m gloss',qty:8,s:3,due:'Wed 23',who:'JM',cost:4.1,waste:6},
    {id:'JOB-0316',t:'Billboard skins × 12',p:'PRJ-0230',mat:'Flex banner 3.2m',qty:12,s:4,due:'Mon 28',who:'JA',cost:5.6,waste:3}
  ],
  trips:[
    {id:'TRP-0091',what:'3 display units + gazebo',p:'PRJ-0231',to:'Mwanza',veh:'T 482 DXY',drv:'Amani Juma',s:1,date:'Tue 22 · 05:30'},
    {id:'TRP-0092',what:'Roll-up banners × 24',p:'PRJ-0231',to:'Musoma',veh:'T 119 DKL',drv:'Hassan Rajab',s:0,date:'Thu 24 · 06:00'},
    {id:'TRP-0093',what:'Expo stand structure',p:'PRJ-0233',to:'Mlimani City',veh:'T 733 DGH',drv:'Hassan Rajab',s:0,date:'Thu 24 · 14:00'},
    {id:'TRP-0089',what:'Banners delivery',p:'PRJ-0226',to:'Mikocheni',veh:'T 733 DGH',drv:'Amani Juma',s:3,date:'Mon 21 · 14:00'},
    {id:'TRP-0087',what:'Uniform cartons × 40',p:'PRJ-0219',to:'Bahari HQ',veh:'T 119 DKL',drv:'Hassan Rajab',s:4,date:'Fri 18'}
  ],
  vehicles:[{reg:'T 482 DXY',type:'Isuzu NPR · 3 tonne'},{reg:'T 119 DKL',type:'Toyota Hiace · crew van'},{reg:'T 733 DGH',type:'Mitsubishi Canter',svc:'30 Sep'}],
  docs:[
    {id:1,n:'Serengeti Telecom — signed contract.pdf',type:'Contract',p:'PRJ-0231',by:'SK',d:'02 Sep',sz:'1.2 MB'},
    {id:2,n:'Lake Zone roadshow brief.pdf',type:'Brief',p:'PRJ-0231',by:'NL',d:'28 Aug',sz:'640 KB'},
    {id:3,n:'Pwani outlet designs v3.png',type:'Design',p:'PRJ-0228',by:'RS',d:'15 Sep',sz:'4.8 MB'},
    {id:4,n:'Kilimo Bank proposal PRO-0148.pdf',type:'Proposal',p:'PRJ-0230',by:'SK',d:'12 Sep',sz:'2.1 MB'},
    {id:5,n:'INV-0195 payment receipt.pdf',type:'Receipt',p:'PRJ-0231',by:'RT',d:'15 Sep',sz:'180 KB'},
    {id:6,n:'Mlimani stand — client approval.pdf',type:'Client approval',p:'PRJ-0233',by:'NL',d:'19 Sep',sz:'920 KB'},
    {id:7,n:'PO-0204 Plastiko Ltd.pdf',type:'Purchase',p:'PRJ-0230',by:'FH',d:'18 Sep',sz:'210 KB'},
    {id:8,n:'W38 Monday Briefing minutes.pdf',type:'Report',p:'',by:'DK',d:'15 Sep',sz:'350 KB'}
  ],
  events:[
    {id:1,d:'Mon 21',t:'08:00',n:'Monday Briefing',k:'meet'},{id:2,d:'Mon 21',t:'11:00',n:'Safari Mobile pitch prep',k:'proj'},
    {id:3,d:'Tue 22',t:'05:30',n:'Dispatch to Mwanza',k:'log'},{id:4,d:'Tue 22',t:'09:00',n:'Serengeti contract review · Boardroom',k:'client'},
    {id:5,d:'Tue 22',t:'14:00',n:'Mlimani Bank pitch · Boardroom',k:'client'},{id:6,d:'Wed 23',t:'16:00',n:'Pwani outlet branding deadline',k:'dead'},
    {id:7,d:'Thu 24',t:'06:00',n:'Roadshow crew → Musoma',k:'log'},{id:8,d:'Thu 24',t:'14:00',n:'Expo stand delivery',k:'log'},
    {id:9,d:'Fri 25',t:'09:00',n:'Mlimani Bank Expo opens',k:'event'},{id:10,d:'Fri 25',t:'15:00',n:'Venue walkthrough · Serena',k:'proj'}
  ],
  teamUpdates:[
    {id:1,who:'JM',t:'Outlet 3 branding on schedule. Outlet 4 wall is damp \u2014 needs repair before we install.',pres:false,time:'Fri 16:40'},
    {id:2,who:'AJ',t:'Mwanza delivery route confirmed for Tuesday. Fuel float is at 60% used.',pres:false,time:'Fri 17:05'},
    {id:3,who:'NL',t:'Mlimani Bank walkthrough deck ready \u2014 covers stand concept, timeline and cost options.',pres:true,time:'Mon 07:50'}
  ],
  newUpdate:{who:'SK', t:'', pres:false},
  visitors:[
    {id:1,name:'James Mollel',co:'Serengeti Telecom',purpose:'Contract review',host:'SK',time:'09:15',st:'in'},
    {id:2,name:'Grace Kimaro',co:'Chapa Supplies',purpose:'Deliver invoice',host:'RT',time:'10:02',st:'out'},
    {id:3,name:'Peter Nnko',co:'Applicant',purpose:'Interview \u2014 Graphic Designer role',host:'MM',time:'11:30',st:'waiting'}
  ],
  newVisitor:{name:'',co:'',purpose:'',host:'SK'},
  rooms:[
    {id:'R1',n:'Boardroom',cap:12,b:{'09':['SK','Serengeti contract review'],'10':['SK','Serengeti contract review'],'14':['DK','Mlimani Bank pitch']}},
    {id:'R2',n:'Creative studio',cap:6,b:{'11':['RS','Design review · Nyota'],'15':['NL','Safari Mobile concept']}},
    {id:'R3',n:'Huddle room',cap:4,b:{'08':['MM','Ops stand-up']}}
  ],
  roomTitle:'Client meeting',
  deliveries:[
    {id:'DLV-401',from:'Chapa Supplies',items:'Vinyl rolls × 12',st:'arrived',time:'08:50',sku:'VNL-137G',qty:12},
    {id:'DLV-402',from:'PrintHub DSM',items:'Stand graphics proof',st:'expected',time:'14:00'},
    {id:'DLV-403',from:'Kariakoo Tents',items:'Gazebo tents × 2',st:'arrived',time:'09:30',sku:'GZB-3X3',qty:2}
  ]
};
}
