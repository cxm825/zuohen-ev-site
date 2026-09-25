# Product catalog cleanup report

Generated 2026-09-17 from `public/products.json` (400 items).
**This report is read-only — nothing has been removed from the catalog yet.**

## Summary

| Metric | Count |
| --- | --- |
| Total products | 400 |
| Critical data errors (duplicate slugs) | 11 |
| Exact duplicate rows | 0 |
| Near-duplicate rows | 12 |
| Items with data-quality flags | 112 |
| **Recommended removals (duplicates only)** | **23** |
| Catalog after cleanup | **377** |

Keeper selection: within each group the item with a price and image wins; ties go to the shorter, cleaner title. IDs refer to the `id` field in products.json.

## 1. Critical: duplicate slugs

Two or more products share one slug. Slugs key the product URLs, so these break canonical URLs and must be resolved first (keep one, or re-slug).

| ID | Title | Category | Image | Price | Action |
| --- | --- | --- | --- | --- | --- |
| 10 | Car Side DC CHAdeMO Socket Charge Inlet Ev Charger Fast Charging Electric Vehicle Connecto… | Adapter | yes | yes | **KEEP** — duplicate slug "car-side-dc-chademo-socket-charge-inlet-ev-charger-fast-charging-electric-vehicle-connector-socket-125a" |
| 140 | Car Side DC CHAdeMO Socket Charge Inlet Ev Charger Fast Charging Electric Vehicle Connecto… | Adapter | yes | yes | remove — duplicate of #10 |
| | | | | | |
| 26 | New AC DC EV Plug Adapter Form Tesla to CCS2 250A NACS to CCS Combo CCS2 for Car with IP54… | Adapter | yes | yes | **KEEP** — duplicate slug "new-ac-dc-ev-plug-adapter-form-tesla-to-ccs2-250a-nacs-to-ccs-combo-ccs2-for-car-with-ip54-protection-converter-connector" |
| 69 | New AC DC EV Plug Adapter Form Tesla to CCS2 250A NACS to CCS Combo CCS2 for Car with IP54… | Adapter | yes | yes | remove — duplicate of #26 |
| | | | | | |
| 39 | 300A CCS2 to GBT DC Fast Charger Adapter | for BYD/Geely EVs | Portable Fireproof for BYD … | Adapter | yes | yes | **KEEP** — duplicate slug "300a-ccs2-to-gbt-dc-fast-charger-adapter-for-byd-geely-evs-portable-fireproof-for-byd-yuan-up-seagull-owners" |
| 145 | 300A CCS2 to GBT DC Fast Charger Adapter | for BYD/Geely EVs | Portable Fireproof for BYD … | Adapter | yes | yes | remove — duplicate of #39 |
| 243 | 300A CCS2 to GBT DC Fast Charger Adapter | for BYD/Geely EVs | Portable Fireproof for BYD … | Adapter | yes | yes | remove — duplicate of #39 |
| 252 | 300A CCS2 to GBT DC Fast Charger Adapter | for BYD/Geely EVs | Portable Fireproof for BYD … | Adapter | yes | yes | remove — duplicate of #39 |
| 312 | 300A CCS2 to GBT DC Fast Charger Adapter | for BYD/Geely EVs | Portable Fireproof for BYD … | Adapter | yes | yes | remove — duplicate of #39 |
| | | | | | |
| 71 | CCS2 to GBT 400A Adapter for Electric Car 400kw New Energy Vehicle EV Charging Gun Adapter | Adapter | yes | yes | **KEEP** — duplicate slug "ccs2-to-gbt-400a-adapter-for-electric-car-400kw-new-energy-vehicle-ev-charging-gun-adapter" |
| 189 | CCS2 to GBT 400A Adapter for Electric Car 400kw New Energy Vehicle EV Charging Gun Adapter | Adapter | yes | yes | remove — duplicate of #71 |
| | | | | | |
| 92 | 240KW Double Charging Gun DC Charging Station CCS1 CCS2 GBT CHAdeMO Type EV Charger Suppor… | DC Charging | yes | yes | **KEEP** — duplicate slug "240kw-double-charging-gun-dc-charging-station-ccs1-ccs2-gbt-chademo-type-ev-charger-supporting-ocpp-network" |
| 152 | 240KW Double Charging Gun DC Charging Station CCS1 CCS2 GBT CHAdeMO Type EV Charger Suppor… | DC Charging | yes | yes | remove — duplicate of #92 |
| | | | | | |
| 200 | GBT Test EV Charger Plug Testing EV Charger Tester for GB/T EV Charging Pile Tester with R… | Adapter | yes | yes | **KEEP** — duplicate slug "gbt-test-ev-charger-plug-testing-ev-charger-tester-for-gb-t-ev-charging-pile-tester-with-resistive-load-field-vehicle-simulator" |
| 369 | GBT Test EV Charger Plug Testing EV Charger Tester for GB/T EV Charging Pile Tester with R… | Adapter | yes | yes | remove — duplicate of #200 |
| | | | | | |
| 284 | Wholesale 7kw Type 2 to Tesla Electric Car Adapter 32a 220v 62196 Type2 to Tesla Adapter A… | Adapter | yes | yes | **KEEP** — duplicate slug "wholesale-7kw-type-2-to-tesla-electric-car-adapter-32a-220v-62196-type2-to-tesla-adapter-ac-for-cybertruck-model-3-y-s-x" |
| 356 | Wholesale 7kw Type 2 to Tesla Electric Car Adapter 32a 220v 62196 Type2 to Tesla Adapter A… | Adapter | yes | yes | remove — duplicate of #284 |
| | | | | | |
| 324 | Hot Selling 20KW 30kw 40KW CCS GBT Ev Charger Electric Car Ev Dc Charging Station,China Wh… | DC Charging | yes | yes | **KEEP** — duplicate slug "hot-selling-20kw-30kw-40kw-ccs-gbt-ev-charger-electric-car-ev-dc-charging-station-china-wholesale-ev-dc-charger-station" |
| 347 | Hot Selling 20KW 30kw 40KW CCS GBT Ev Charger Electric Car Ev Dc Charging Station,China Wh… | DC Charging | yes | yes | remove — duplicate of #324 |
| | | | | | |

## 3. Near-duplicates

Same power rating and ≥72% title-token overlap — most of these are the same hardware in trim variants. Review before removal; genuine variants (color, cable length) may be worth keeping.

| ID | Title | Category | Image | Price | Action |
| --- | --- | --- | --- | --- | --- |
| 90 | 2026 HOT DC Connectors Factory EV Fast Charging Plug 250A DC EV Charger Connector CCS2 to … | Adapter | yes | yes | **KEEP** — similar title (93% overlap, no-kw) |
| 344 | 2026 DC Connectors Factory EV Fast Charging Plug 250A DC EV Charger Connector CCS2 to CHAd… | Adapter | yes | yes | remove — duplicate of #90 |
| | | | | | |
| 104 | Type 2 EV Charger Plug Cable Holder Wall Mount Bracket Socket Ev Charger Plug Holder Wall … | Adapter | yes | yes | **KEEP** — similar title (100% overlap, no-kw) |
| 173 | EV Charger Type 2 Plug Cable Holder Wall Mount Bracket Socket Ev Charger Plug Holder Wall … | Adapter | yes | yes | remove — duplicate of #104 |
| | | | | | |
| 112 | GBT to CCS1 1000V 250A Fast DC EV Adapter GBT to CCS1 for Charger Car Electric USA Car Tes… | Adapter | yes | yes | remove — duplicate of #307 |
| 307 | GBT to CCS1 1000V 250A Fast DC EV Adapter Outlet GBT CCS1 Charger Electric USA Tesla Chevr… | Adapter | yes | yes | **KEEP** — similar title (84% overlap, no-kw) |
| | | | | | |
| 136 | Perfect CCS2 to CHAdeMO DC Fast EV Charging Adapter 1000V 250A for Japanese Car Nissan Suz… | Adapter | yes | yes | **KEEP** — similar title (86% overlap, no-kw) |
| 393 | CCS2 to CHAdeMO DC Fast EV Charging Adapter 1000V 250A for Japanese Car Nissan Suzuki Swif… | Adapter | yes | yes | remove — duplicate of #136 |
| | | | | | |
| 220 | Perfect CCS2 to GBT 300A DC Fast EV Charging Adapter for Chinese Car BYD XIAOMI ZEEKR VM I… | Adapter | yes | yes | remove — duplicate of #365 |
| 365 | CCS2 to GBT 300A DC Fast EV Charging Adapter for Chinese Car BYD XIAOMI ZEEKR VM ID3 ID6 T… | Adapter | yes | yes | **KEEP** — similar title (92% overlap, no-kw) |
| | | | | | |
| 34 | Ev Car Charger IP65 Outdoor Wall Mounted Metal Enclosure Protective Box with Glass Door So… | EV Charging | yes | yes | remove — duplicate of #82 |
| 82 | Outdoor Wall Mounted Metal Enclosure Ev Car Charger Metal Enclosure Protective Box with Gl… | EV Charging | yes | yes | **KEEP** — similar title (81% overlap, no-kw) |
| | | | | | |
| 177 | Outdoor Wall Mounted Plastic+ABS Enclosure EV Car Charger IP65 CE Certified New Protective… | EV Charging | yes | yes | **KEEP** — similar title (100% overlap, no-kw) |
| 254 | New Outdoor Wall Mounted Plastic+ABS Enclosure CE Certified IP65 Protective Box for EV Car… | EV Charging | yes | yes | remove — duplicate of #177 |
| | | | | | |
| 166 | Type 1 Type 2 GBT EV Wall-Mounted Charging Station TA-AC-E11-F 11KW AC 380V 5m Cable <55dB | AC Charging | yes | yes | **KEEP** — similar title (80% overlap, 11kw,11kw) |
| 188 | 11KW Type 1 Type 2 GBT AC EV Wall-Mounted Charger Station TA-AC-E11-F 5M Cable 380V Brand … | AC Charging | yes | yes | remove — duplicate of #166 |
| | | | | | |
| 88 | New Energy Electric Vehicle Charging Pile National Standard European Standard DC 3-phase H… | DC Charging | yes | yes | **KEEP** — similar title (80% overlap, no-kw) |
| 242 | New Energy Electric Vehicle Charging Pile National European Standards DC 3-Phase Home Wall… | DC Charging | yes | yes | remove — duplicate of #88 |
| | | | | | |
| 148 | 2026 New Upgraded 400Kw 400A CCS2 to GBT DC Adapter EV V300A Adapter Source Factory OTA Up… | Adapter | yes | yes | **KEEP** — similar title (89% overlap, 400kw,400kw) |
| 179 | 2026 New Upgraded 400Kw 400A CCS2 to GBT DC Adapter EV V300A Adapter Source Factory OTA Up… | Adapter | yes | yes | remove — duplicate of #148 |
| | | | | | |
| 265 | 400A 400KW CCS2 to GBT EV Charging Adapter DC Fast Charging Connector Converter for Chines… | Adapter | yes | yes | remove — duplicate of #372 |
| 372 | 400A CCS2 to GBT EV Fast Charging Adapter DC 400kW Converter | Adapter | yes | yes | **KEEP** — similar title (73% overlap, 400kw,400kw) |
| | | | | | |
| 246 | 20KW DC Fast Ev Charger Charging Station GBT Electric 22KW Car Portable for Car Charging S… | Portable | yes | yes | remove — duplicate of #350 |
| 350 | 22KW DC Fast Ev Charger Charging Station GBT 20kW Electric Car Portable for Car Charging S… | Portable | yes | yes | **KEEP** — similar title (92% overlap, 20kw,20kw,22kw,22kw) |
| | | | | | |

## 4. Data-quality flags (kept, for review)

| ID | Title | Category | Image | Price | Problems |
| --- | --- | --- | --- | --- | --- |
| 1 | EV Adapter Tesla to CCS DC Charging NACS to Ccs1 Adapter 200a Charger for Tesla American t… | Adapter | yes | yes | no power rating anywhere |
| 12 | GBT V2L Plug Adapter AC 220-250V Max 16A Best Price | Adapter | yes | yes | no power rating anywhere |
| 15 | New CE Certified Outdoor Anti-theft IP65 Rustproof Wallbox Metal Floor Mounted EV Charging… | AC Charging | yes | yes | no power rating anywhere |
| 16 | EV Charging Station Pillar Stand for EV Charger Installation | EV Charging | yes | yes | no power rating anywhere |
| 17 | Type 2 Test EV Charger Plug Testing EV Charger Tester for IEC Type 2 EV Charging Piles Tes… | Adapter | yes | yes | no power rating anywhere |
| 18 | TYPE2 to EU/US/CN V2L Electric Steam Charging Cable Gun Discharge Type 2 Car New Energy Ve… | Adapter | yes | yes | no power rating anywhere |
| 19 | 32A Electric Car Charging Cable Adapters New Condition Double Gun Mode 2 Type2 to Type 2 E… | Adapter | yes | yes | no power rating anywhere |
| 22 | Lily 300A DC Charging EV Connector Faster Charger Ccs2 to Gbt Adapter tesla Dc Electric So… | Adapter | yes | yes | no power rating anywhere |
| 24 | Ev Fast Charging Plug 250a Dc Electric Vehicle Dc Charger Connector Ccs1 to Chademo Adapte… | Adapter | yes | yes | no power rating anywhere |
| 29 | Car Fast EV Charger Electric Vehicle 200A CCS DC EV Adapter CCS2 to CCS1 EVSE Controller C… | Adapter | yes | yes | no power rating anywhere |
| 31 | Original Manufactured Male Type 2 to GBT type1 Ev Charger Adapter With Locking Ev Charging… | Adapter | yes | yes | no power rating anywhere |
| 35 | European Standard Charging Pile Fixed Seat DC AC Fixed Frame Charging Gun DC Fixed Seat wi… | AC Charging | yes | yes | no power rating anywhere |
| 36 | Model 3 T2-T2 New Energy Vehicle's European Standard Double-Headed Gun Electric Vehicle Ch… | EV Charging | yes | yes | no power rating anywhere |
| 41 | DC Holder Chademo Standard Charging Pile Fixed Seat DC Fixed Frame Charging Gun DC Chademo… | Adapter | yes | yes | no power rating anywhere |
| 42 | EV DC Plug Female CCS2 Ev Charging Plug Cable Adapter/converter 63A 80A 125A 150A 200A 250… | Adapter | yes | yes | no power rating anywhere |
| 44 | New Plug CCS2 to Tesla DC+AC Adapter for Electric Vehicles | Adapter | yes | yes | no power rating anywhere |
| 48 | Floor-Standing Electric Vehicle DC Fast Charging Pile High-Power Dual-Port New Energy TA-D… | AC Charging | yes | yes | no power rating anywhere |
| 53 | Type 2 16A 32A Male Plug Socket Type2 Female Ev Charging Cable Adapter/converter | Adapter | yes | yes | no power rating anywhere |
| 57 | CCS1/CCS2 to GBT DC EV Charger Adapter 200A for Electric Vehicle Car Charging Station-New … | Adapter | yes | yes | no power rating anywhere |
| 60 | TYPE2 TYPE1 Electric Steam Charging Cable Double Gun Line New Energy Vehicle 16A/32A Europ… | EV Charging | yes | yes | no power rating anywhere |
| 62 | EV DC Plug Female GBT Ev Charging Cable Adapter/converter 125A 5 Meters GB/T Ev Charger Gu… | Adapter | yes | yes | no power rating anywhere |
| 63 | DC Fast Charge Connector 250a 200-1000v Ccs2 Type2 to Tesla Adapter Ac+dc 2 in 1 for Cyber… | Adapter | yes | yes | no power rating anywhere |
| 64 | New Wholesale Cheap 1000V 250A CCS1 to GBT DC Fast EV Charging Adapter for BYD MG CHERY AI… | Adapter | yes | yes | no power rating anywhere |
| 73 | 2026 HOT EV Charging Connector GBT to CCS2 400A with APP Chargers Adapters AC Adapter Conn… | Adapter | yes | yes | no power rating anywhere |
| 77 | 1000V 300A CCS2 to GBT DC Charger Adapter with IP55 Rating CE Certification 12-Month Warra… | Adapter | yes | yes | no power rating anywhere |
| 80 | 30 KWH 60 KWH CCS 2 Lithium Battery Energy Storage Charging All-in-one Machine Solar | DC Charging | yes | yes | no power rating anywhere |
| 86 | 2026 Adapter DC Connectors CCS2 to GBT DC Charging EV Adapter Connector Adapter 400A Adapt… | Adapter | yes | yes | no power rating anywhere |
| 94 | 16a New Energy Vehicle Charging Cable Type 2 to Schuko Socket Ev Charging Adapter Cable Eu… | Adapter | yes | yes | no power rating anywhere |
| 95 | Lily DC Fast Charging EV Adapter GBT to CCS1 Connector China Pillar to USA GB/T to CCS1 Ca… | Adapter | yes | yes | no power rating anywhere |
| 97 | Power Station LiFePO4 2000Wh Quality Assured Portable Storage Generator Backup Power Stati… | Portable | yes | yes | no power rating anywhere |
| 99 | CCS2 to CCS1 DC Adapter Female Ccs 2 to Ccs 1 Adopte 250a Charger for Tesla American to Eu… | Adapter | yes | yes | no power rating anywhere |
| 103 | Level 2 Latest Home Ev Wallbox Charging Station 230v Single Phase Electric Car Charger Wit… | Adapter | yes | yes | no power rating anywhere |
| 107 | CCS2 to CCS1 DC+AC Adapter Converter for Electric Vehicle Charging | Adapter | yes | yes | no power rating anywhere |
| 110 | New Electric Car Charging Type 2 DC Adapter TESLA EV Charger Supercharger Adapter CE Certi… | Adapter | yes | yes | no power rating anywhere |
| 111 | Type 1 EV Charger Plug Cable Holder Wall Mount Bracket Socket Ev Charger Plug Holder Wall … | Adapter | yes | yes | no power rating anywhere |
| 116 | New Energy Type 2 Charging Pile Conversion Plug RV Electric Motorcycle Scooter to Take Hou… | Adapter | yes | yes | no power rating anywhere |
| 122 | GBT to Type2 Adapter AC New Condition 220V-250V National to European Plug for Electric Veh… | Adapter | yes | yes | no power rating anywhere |
| 129 | Ev Fast Charging Plug 250a Dc Combo Electric Vehicle Dc Charger Connector Ccs2 to Chademo … | Adapter | yes | yes | no power rating anywhere |
| 130 | 400A DC Fast Charging Gbt to Ccs2 Evse Charging Connector Ce Ev Dc Charger GB/T to Ccs Ada… | Adapter | yes | yes | no power rating anywhere |
| 141 | Multi-Nation Travel Adapter with USB Charger for EU/UK/US/AU Plugs Power Use | Adapter | yes | yes | no power rating anywhere |
| 146 | Adapter for Drawing Power From Type 2 Ev Charging Piles Used for Scooters Get Electricity | Adapter | yes | yes | no power rating anywhere |
| 155 | 1000V 300A CCS2 to GBT DC Fast EV Charging Adapter for Chinese Car BYD BMW ZEEKR XIAOMI V … | Adapter | yes | yes | no power rating anywhere |
| 161 | Adapter Discharger Plug BYD Conversion Socket Electric Vehicle External Discharge Equipmen… | Adapter | yes | yes | no power rating anywhere |
| 163 | EV Charger GBT Plug Cable Holder Wall Mount Bracket Socket Ev Charger Plug Holder Wall Mou… | Adapter | yes | yes | no power rating anywhere |
| 165 | New DC Charging Adapter GBT Tesla Fast Charging Connector 100-1000VDC 250A CE ROHS Certifi… | Adapter | yes | yes | no power rating anywhere |
| 169 | CCS2 to CCS1 DC+AC Fast EV Charging Adapter with IP54 Rating 500-1000V DC/250V AC 400A/32A… | Adapter | yes | yes | no power rating anywhere |
| 171 | New Energy Vehicles OEM NACS Charger GBT to Tesla EV Adapter 250A 100-1000VDC for Cybertru… | Adapter | yes | yes | no power rating anywhere |
| 175 | DC Fast Gbt to Ccs1 Dc Ev Adapter Charger New Electric Vehicle Charging Gun Connector for … | Adapter | yes | yes | no power rating anywhere |
| 176 | Portable Ev Charger 13A 16a 250v Gb/t Car Charging Cable With Lcd Screen and 32A Cee Plug … | Adapter | yes | yes | no power rating anywhere |
| 181 | 400A CCS2 to GB/T Adapter High Power EV Fast Charging Converter Plug | Adapter | yes | yes | no power rating anywhere |
| 182 | New Household Outdoor EV Wall Box for Tesla Chargers CE Certified Plastic+ABS Black Protec… | EV Charging | yes | yes | no power rating anywhere |
| 197 | GBT EV Charging Station Adapter Convert GB/T to CCS2/CCS DC Fast Adapter GBT to CCS2 Elect… | Adapter | yes | yes | no power rating anywhere |
| 199 | EV Charging Station Gun Connector Holder Wall Connector Holster Electric Car Cable Organiz… | Adapter | yes | yes | no power rating anywhere |
| 207 | New GBT to Tesla Male Plug EV Charger Adapter with Locking Feature CE Certified 1 Year War… | Adapter | yes | yes | no power rating anywhere |
| 208 | New Energy Tram European Standard Type 2 V2L Car Discharge Adapter Cable SCHUCO Power Conv… | Adapter | yes | yes | no power rating anywhere |
| 219 | Electric Car Charging Pile Hanging Hook Line Plug Gun Hanging Seat Empty Seat Fixed Gun He… | Adapter | yes | yes | no power rating anywhere |
| 221 | CCS2 to CHAdeMO DC Adapter 250A 1000V Japanese Standard for CHAdeMO Electric Vehicle Fast … | Adapter | yes | yes | no power rating anywhere |
| 222 | Ev Charger Adapter GB/T to Type 2 Ip54 32a Portable Ev Charger Connector Electric Car Char… | Adapter | yes | yes | no power rating anywhere |
| 223 | Type 1 to Tesla Adapter Ev Charger Adapter 16A 32A Male Female Ev Charging AC Cable Adapte… | Adapter | yes | yes | no power rating anywhere |
| 225 | Car Side DC GB/T Socket Charge Inlet Ev Charger Fast Charging Electric Vehicle Connector S… | Adapter | yes | yes | no power rating anywhere |
| 226 | Hot Sale Cheap Led Light Base Round | EV Charging | yes | yes | no power rating anywhere |
| 228 | Lily DC Fast Charging Adapter CHAdeMO to GBT Connector Japan 150a Chademo to Gb/t Charge C… | Adapter | yes | yes | no power rating anywhere |
| 229 | DC Charge Pile Cable Colletion EV Charging Station Pillar Stand for EV Charger Installatio… | DC Charging | yes | yes | no power rating anywhere |
| 234 | EV 250A DC CCS2 to CHADEMO Adapter New Energy Electric Vehicle DC Fast Charging CCS2 to CH… | Adapter | yes | yes | no power rating anywhere |
| 235 | Type1 Test EV Charger Plug Testing EV Charger Tester for J1772 Type1 EV Charging Piles Tes… | Adapter | yes | yes | no power rating anywhere |
| 240 | New Customizable GBT to CCS2 DC Fast EV Charging Adapter OEM Logo Customization for Europe… | Adapter | yes | yes | no power rating anywhere |
| 241 | Lily DC 300A CCS2 to GBT Fast Charging EV Adapter CHAdeMO to GBT Connector Ccs2 to Gb/t Co… | Adapter | yes | yes | no power rating anywhere |
| 250 | New GBT-CCS2 DC Adapter for CCS2 Cars IP54 Waterproof CE/FCC Certified EV Charger with 1 Y… | Adapter | yes | yes | no power rating anywhere |
| 257 | Copper Brush for Device Machine Equipment Cleaning | EV Charging | yes | yes | no power rating anywhere |
| 262 | Upgrade 400A 400KWH MAX CCS2 to GBT DC EVSE Charging Adapter 1000V IP54 Protection Plug | Adapter | yes | yes | no power rating anywhere |
| 263 | Cheap Price EV AC Ccs2 to tesla Adapter Electric Vehicle Charging Connectors Adapters | Adapter | yes | yes | no power rating anywhere |
| 266 | AC EV Charger Protection solar Box Wall Mounted New Energy Car Electric Charging Pile for … | AC Charging | yes | yes | no power rating anywhere |
| 267 | DC Fast Charging Plug 400A CCS2 to GBT Adapter with IP54 Protection 400KWH MAX 500-1000V E… | Adapter | yes | yes | no power rating anywhere |
| 275 | AC Portable Charging Tester Type 2 Type 1Portable Affordable and High-Quality Charging Sta… | Portable | yes | yes | no power rating anywhere |
| 280 | Lily EV Charger Type2 Plug Cable Holder Wall Mount Bracket Socket IEC Ev Charger Plug Hold… | Adapter | yes | yes | no power rating anywhere |
| 281 | New Male Plug Type 2 to GBT EV Charger Adapter with Locking Feature AC 16A/32A Thermoplast… | Adapter | yes | yes | no power rating anywhere |
| 282 | Outdoor Wall Mounted Metal Enclosure Box Waterproof Ev Charger Protective Case Ac Charge P… | AC Charging | yes | yes | no power rating anywhere |
| 283 | CCS2 to Tesla Adapter | Adapter | yes | yes | no power rating anywhere |
| 285 | AC Type 2 to GB/T Adapter European to China Car 32A Male Female Ev Charging Cable Adapter/… | Adapter | yes | yes | no power rating anywhere |
| 290 | NEV Parts & Accessories GBT to CCS1 EV Charger Adapter Converter 250A AC DC Adapter Connec… | Adapter | yes | yes | no power rating anywhere |
| 293 | 2026 Wholesale Ev Charger DC Connectors CCS2 to GBT 300A DC Charging EV Adapter Connector … | Adapter | yes | yes | no power rating anywhere |
| 298 | CCS2 to GBT Connector 400A 1000V High Power Electric Vehicle Equipment CCS2 to GBT DC Char… | Adapter | yes | yes | no power rating anywhere |
| 299 | Level 2 Connector EV Charger Cable Holster Type2 Socket Holder IEC 62196-2 EVSE Charger Pl… | Adapter | yes | yes | no power rating anywhere |
| 300 | CCS1 to Tesla Plug Adapter Brand New | Adapter | yes | yes | no power rating anywhere |
| 301 | HOT 2026 New CCS1 to GBT Adapter 250A Max DC Fast Charging Converter for Electric Cars | Adapter | yes | yes | no power rating anywhere |
| 302 | CCS2 Type2 to CCS1 J772 EV Charger Adapter AC/DC Dual Mode IP54 Rated 500-1000V DC/250V AC… | Adapter | yes | yes | no power rating anywhere |
| 303 | Ccs1 to Gbt Evse EV Charging Connector Ce Ev Dc Charger Chademo to Ccs Adapter for tesla 2… | Adapter | yes | yes | no power rating anywhere |
| 305 | 2026 DC 400A 1000V CCS2 to GBT Adapter EV Charging Connector for Chinese Cars Plug with Sm… | Adapter | yes | yes | no power rating anywhere |
| 306 | EV AC Plug Female Tesla Ev Charging Cable Adapter/converter 16A 32A 40A 50A 70A 80A Tesla … | Adapter | yes | yes | no power rating anywhere |
| 309 | Lily Best 15kWh 4W Online UPS Household Energy Storage Power Supply Product Specification … | Portable | yes | yes | no power rating anywhere |
| 315 | 250A 1000V High Power Electric Vehicle Supply Equipment CCS1 to GBT DC Adapter Connector C… | Adapter | yes | yes | no power rating anywhere |
| 318 | 2026 DC Factory EV Fast Charging Plug 250A DC EV Charger Connector CCS2-NACS AC+DC Adapter… | Adapter | yes | yes | no power rating anywhere |
| 321 | L2 EV Charger Cable Management System Level 2 Charging Station Cable Protect for EV Charge… | EV Charging | yes | yes | no power rating anywhere |
| 323 | CCS1 to CHAdeMO DC Adapter 250A 1000V Japanese Standard for CHAdeMO Electric Vehicle Fast … | Adapter | yes | yes | no power rating anywhere |
| 327 | OCPP New Energy Electric Vehicle DC Fast Charging Pile Card Swiping Code Scanning GBT 2023… | DC Charging | yes | yes | no power rating anywhere |
| 329 | DC Ev Fast Supercharger Ccs1 to Tesla Charging Adapter Max 500a 1000v Ccs to Nacs Converte… | Adapter | yes | yes | no power rating anywhere |
| 333 | Ev Fast Charging Plug 400A Dc Combo Electric Vehicle Dc Ev Charger Connector Ccs2 to GBT A… | Adapter | yes | yes | no power rating anywhere |
| 334 | CCS2 European Standard Charging Pile Fixed Seat DC Fixed Frame Charging Gun DC Fixed Seat … | Adapter | yes | yes | no power rating anywhere |
| 336 | 1000V 300A CCS2 to GBT DC Fast EV Charging Adapter for Chinese Ca Cheap Factory Price | Adapter | yes | yes | no power rating anywhere |
| 345 | Lily CCS2 to CCS1 DC Adapter European to US Female Female Ev Charging Cable Adapter/conver… | Adapter | yes | yes | no power rating anywhere |
| 348 | CCS2 to Type2 Adapter Brand New Made in China Supports New and Old European Standards | Adapter | yes | yes | no power rating anywhere |
| 353 | DC Charging EV Adapter GB/T to CCS2 Plug Connector 300A | Adapter | yes | yes | no power rating anywhere |
| 355 | 250A DC EV Adapter GBT to CCS1 Adapter DC Charging Adapter | Adapter | yes | yes | no power rating anywhere |
| 359 | EV DC 300A 1000V CCS2 to GBT Electric Car Charging Dc Adapter Ccs Combo 2 to Gbt for EV Fa… | Adapter | yes | yes | no power rating anywhere |
| 370 | EV DC Plug Female CCS1 Ev Charging Cable Adapter/converter 125A 5 Meters CCS 1 Ev Charger … | Adapter | yes | yes | no power rating anywhere |
| 373 | EV Adapter DC Charging Ccs1 to Ccs2 Adapter 200a Charger for Tesla American to European St… | Adapter | yes | yes | no power rating anywhere |
| 374 | New CE Certified Outdoor Anti-theft IP65 Rustproof Wall Mounted EV Charging Protective Cas… | EV Charging | yes | yes | no power rating anywhere |
| 388 | Factory DC GBT to CHAdeMO New Energy Vehicle Ev Charger Station EV Connector | Adapter | yes | yes | no power rating anywhere |
| 391 | Iec 62196-1 Socket Station Side Type 2 Female Socket Charge Inlet Ev Charger Connector Soc… | Adapter | yes | yes | no power rating anywhere |
| 392 | IEC 62196-2 Female Type 2 Plug Holder EV Charging Holder Fix Dummy Bracket Socket Cable Co… | Adapter | yes | yes | no power rating anywhere |
| 397 | DC Fast Charge Ccs2 to Tesla Adapter Evse Charging Connector Ce Ev Dc Charger Ccs2-Tesla A… | Adapter | yes | yes | no power rating anywhere |
| 398 | Type 1 to Type 2 Adapter European to US 16A 32A Male Female Ev Charging Cable Adapter/conv… | Adapter | yes | yes | no power rating anywhere |

These are not counted in the removal total above: missing prices and absent power figures are common on brand-new listings, and the asset audit confirms every image file exists. Fix the data or remove them in a second pass once confirmed.

## Suggested next step

Confirm the list, then remove the marked IDs from `public/products.json` (renumber `id` fields) and re-run `npm run audit:assets`. The three pages that consume the catalog (homepage grid, /products, /product) all read the same file, so no other changes are needed.
