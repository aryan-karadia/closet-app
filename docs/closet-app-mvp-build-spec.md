# Closet App MVP: Full Build Spec

## 1. Overview

A free, personal wardrobe app for one user, built as a web app that can be installed on Android as a PWA. It does not try to be a social network, a shop, or a generic fashion app.

Its job is narrow and practical:

1. Learn the user's colour palette from a palette PDF, and let the user correct it.
2. Rate every clothing item against that palette, so the user can see at a glance whether a piece fits.
3. Build outfits from pieces that fit, using fit and proportion rules that are specific to the user and editable by the user.

The outfit builder is the home screen and the main feature. The palette ingester and the item rating exist to make the outfit builder trustworthy. If the builder suggests a piece that clashes with the palette or does not fit the user's build, it has failed, even if the UI looks good.

## 2. User profile (starting point, not a permanent label)

The app must store the profile below as editable settings, not as hard coded assumptions. The user can change any of these, and the outfit builder must update its rules when they change. Nothing in this section is a judgement about the user. It is the fit and colour information the user has already stated, used only to filter and rank clothes.

- Build: slightly bigger build, wide shoulders, large traps, muscular arms.
- Fit preference: tighter fit on arms, loose in chest and stomach area.
- Sizing rule: size tops for wide shoulders and large traps first. Do not size down for tight arms. Get the tight arm fit from a fitted base layer, and keep the outer sweater or cardigan loose in chest and stomach.
- Canada/US size: usually medium. Japan sizing: tops Uniqlo M for a fitted base, Uniqlo L or domestic L to XL for an outer layer. Shoes: US men's 9.5, wide feet, Japan 27.5 cm first, 28.0 cm second.
- Colour palette: Deep Winter. Cool, clear, saturated colours: royal blue, emerald green, rich purple, true red, deep teal, rich plum, dark burgundy. Neutrals: charcoal gray, navy, cool black. Avoid: light pastels, warm oranges, muted earthy hues.
- Jewelry: silver, which fits the cool undertone.
- Style direction: Deep Winter Softboy with structure, also described as structured loverboy. Clean aesthetic, light old money influence but not deep into that aesthetic, light baggy minimal streetwear. Soft texture, relaxed fit, dark cool colours, stronger contrast, one romantic detail per outfit, adapted to a South Asian body and skin tone, not copied from the pastel, low contrast East Asian origin version.
- Watch: budget fancier watch with a leather band is a priority accessory. Digicam is a separate shopping item and is out of scope for the outfit builder.

Important: the palette PDF the user already owns is the female version of the Deep Winter palette. The ingester must ignore its makeup specific tones, hair colours, and beauty sections. Those are not clothing colours for this user, and they must never be used to rate a shirt, sweater, or pair of trousers.

## 3. MVP scope

### In scope for version 1

1. Palette ingester: upload a palette PDF, extract colours and roles, let the user correct and approve them, save the palette, and re rate all items when the palette changes.
2. Item capture: add a clothing item by photo, remove the background, extract dominant colours, rate the item against the active palette, and save it with category, season, fit tags, and status.
3. Wardrobe grid: browse, search, and filter items by category, palette verdict, season, and fit tag. Show palette score and nearest palette colour on each card.
4. Outfit builder (main screen): choose occasion, weather or season, and vibe, generate 3 outfits, show why each outfit was chosen, save an outfit, log that it was worn, and dislike a combination so it is downweighted in future.
5. Advice rules editor: view, add, edit, enable, and disable the fit and proportion rules the builder uses. Every rule shows its reason in plain language.
6. Wear log: record when an outfit was worn, and use wear count to prefer least worn pieces and to calculate cost per wear if the user entered a price.

### Out of scope for version 1

- Physical location tracking. This is intentionally undecided. Do not build a location field into the main flow. Keep a nullable `location` field in the data model for a later version, and a simple status field for now: in rotation, stored, archived. The builder only uses items with status "in rotation".
- Social feed, friends, sharing outfits, or public profiles.
- Virtual try on, avatar rendering, or AI generated images of the user wearing clothes.
- Shopping, product search, retailer import, or Gmail or order history import.
- Calendar integration, weather API integration, or automatic weather based suggestions. Weather and season are manual inputs in version 1.
- Paid AI APIs as a core dependency. See section 9 for the free approach.
- Multi user accounts, teams, or cloud sync for other people. This is a single user app.

### Success criteria for version 1

The MVP is done when all of the following are true, not just when the screens exist:

- A user can upload the Deep Winter PDF, correct the extracted palette in under 5 minutes, and save it.
- A white collared shirt rates as a strong neutral, a navy sweater rates as perfect or strong, a warm orange hoodie rates as avoid, and a light pastel tee rates as avoid. If any of these four are wrong, the rating logic is wrong.
- The outfit builder never puts two outer layers in one outfit, never puts more than one saturated accent in one outfit, and never suggests an archived or stored item as a daily outfit.
- Every suggested outfit shows its palette score, fit match, and contrast reasoning in plain language. A suggestion with no explanation is not acceptable.
- The app works on Android in a mobile browser and as an installed PWA, with no paid service required to use the core features.

## 4. Palette ingester

### 4.1 Input

- File type: PDF, one file at a time.
- The user may upload a new palette later. Uploading a new palette does not delete items. It creates a new palette version and re rates all items against it. The user can switch the active palette back if needed.

### 4.2 What the PDF actually contains, and why parsing hex alone fails

The user's existing Deep Winter PDF was checked during spec writing. It contains:

- Text describing the palette, including named colours and do, neutral, and avoid categories.
- Swatch and mood board images, not embedded hex codes.
- Beauty sections for makeup, blush, hair, and a Facetune promotion, which must be excluded from a clothing palette.

Therefore the ingester must do all of the following, in order, and must not present a result as final until the user approves it.

### 4.3 Ingestion pipeline

Step 1, Text extraction:
- Use pdf.js in the browser to extract text per page, preserving page numbers and approximate section headings.
- Classify text into: core colours, neutral colours, avoid colours, and ignore. Ignore includes makeup, blush, lip, hair, nail, and Facetune sections, and any page that is primarily beauty content.
- Keep the source page number for each extracted colour name, so the user can check it.

Step 2, Page rendering and swatch sampling:
- Render the palette and mood board pages to images at a resolution high enough to sample swatches cleanly, at least 150 DPI equivalent.
- Detect swatch areas. In version 1, this can be semi automatic: find large, flat, saturated rectangles or circles by colour clustering and edge detection, and present each detected swatch to the user.
- Sample the centre of each swatch, avoiding edges, text, and shadows. Record the sampled colour in RGB, then convert to CIELAB and HSL for storage and matching.
- If swatch detection is unreliable on a given PDF, fall back to a manual picker: the user taps a swatch in the rendered page image, and the app samples that point. This fallback is required, not optional, because palette PDFs vary widely in layout.

Step 3, Name to colour mapping:
- Match each sampled colour to the nearest named colour from the text extraction, using hue family and Lab distance, and present the pairing for approval.
- If a sampled colour has no clear name match, label it "Unnamed swatch" and let the user name it.
- If a named colour from the text has no sampled swatch, create it as a text only entry and let the user pick a colour for it manually, or leave it as a named rule with no hex. A named avoid rule, for example "warm oranges", must still work even without an exact hex, by using a hue and saturation range. See section 5.4.

Step 4, User correction screen (required):
- Show every extracted colour as a swatch card with: colour preview, name, role (core, neutral, avoid), source page, and sampled hex.
- The user can: rename, change role, change hex with a colour picker, delete, or add a new colour manually.
- Provide a one tap action: "Remove beauty colours". This deletes any colour tagged as makeup, hair, or beauty during text classification, but the user can undo it.
- Provide a summary before saving: number of core colours, neutrals, and avoids, and a warning if there are zero neutrals or zero avoids, which usually means the extraction missed a section.

Step 5, Save and re rate:
- Save the palette as a versioned record, with the original PDF file name and upload date, but not the full PDF binary unless the user opts in. Storing the PDF is optional and must not be required for rating.
- On save, re rate every item in the wardrobe against the new palette in the background, and show a progress indicator. Do not block the wardrobe screen while re rating.
- Keep the previous palette version, so the user can compare scores before and after a palette change.

### 4.4 Palette data model

Palette:
- id, name, sourceFileName, uploadedAt, isActive, version

PaletteColor:
- id, paletteId, name, hex, labL, labA, labB, hue, saturation, lightness, family, role, sourcePage, isManual
- family: blue, green, purple, red, teal, plum, burgundy, black, gray, navy, orange, brown, pink, yellow, white, other
- role: core, neutral, avoid

Avoid rules that are not a single hex, for example "warm oranges" or "light pastels", are stored as AvoidRule records:
- id, paletteId, name, hueMin, hueMax, saturationMin, saturationMax, lightnessMin, lightnessMax, description
- Example: warm orange, hue 20 to 50, warm undertone, saturation above 40, lightness 30 to 70.
- Example: light pastel, lightness above 75, saturation below 45, any cool or warm hue.

## 5. Item rating

### 5.1 Item capture flow

1. User taps Add item, takes a photo or uploads one. One item per photo. Photos of piles or full closets are not supported for rating, and the UI must say so.
2. Background removal runs in the browser. The user sees the cutout and can confirm it or retake the photo. If background removal fails, the user can still save the item manually, but its palette score is marked "manual, not auto rated" until a better photo is provided.
3. The app extracts dominant colours from garment pixels only, not from the background, skin, or hangers.
4. The app rates the item, shows the score, nearest palette colour, and reason, and lets the user correct the category, season, and fit tags before saving.
5. The item appears in the wardrobe grid with its score badge.

### 5.2 Colour extraction from an item photo

- After background removal, sample garment pixels only.
- Cluster colours using k-means with k equals 4, or a similar lightweight clustering method, in Lab space.
- Discard clusters that are very small, under 5 percent of garment pixels, unless they are a clear accent pattern. Record up to 3 dominant colours with their percentage of the garment.
- Record: primary colour (largest cluster), secondary colours, and whether the item is solid, striped, patterned, or multi colour, as a simple tag the user can correct.
- Store dominant colours in hex and Lab, with percentages. This is what the rating and the outfit builder use, not the raw photo.

### 5.3 Rating formula

Rating is calculated from the primary colour, then adjusted for secondary colours. Use CIELAB Delta E (CIE76 for version 1, CIEDE2000 is a later improvement) for distance to palette swatches.

Base score:
- Find the nearest core or neutral palette colour by Delta E.
- Start with: score equals 100 minus (Delta E times 2), clamped to 0 to 100. A Delta E under 5 gives 90 or above. A Delta E of 15 gives 70. A Delta E of 30 gives 40.
- If the nearest palette colour is a neutral, cap the penalty for low saturation. Neutrals are supposed to be low saturation. A charcoal gray should not be penalised for not being saturated.
- If the nearest palette colour is a core colour, apply a saturation check: a core colour that is much less saturated than the palette swatch loses 10 points, because Deep Winter needs clear, saturated colour, not muted versions.

Avoid check (applied after base score):
- If the primary colour matches an AvoidRule hue, saturation, and lightness range, set the verdict to Avoid and cap the score at 40, regardless of Delta E to a core colour. This prevents a warm orange from scoring well just because it is numerically near a true red swatch.
- If a secondary colour covering more than 25 percent of the garment matches an AvoidRule, subtract 15 points and flag "secondary clash" in the reason.

Final verdict tiers:
- 90 to 100: Perfect. Very close to a core or neutral swatch.
- 70 to 89: Strong. Works well, may be a slightly lighter or deeper version of a palette colour.
- 50 to 69: Works as neutral or accent only. Do not use as the main colour of an outfit unless paired with strong neutrals.
- 0 to 49: Avoid for this palette. Warm, pastel, or muted earth tone that fights the palette contrast.

Every rating must store: score, nearestPaletteColorId and name, verdict, and a plain language reason. Example reasons:
- "This navy is 4 Delta E from your Navy, a perfect neutral match."
- "This is a warm orange, which your palette lists as avoid, even though it is near True Red."
- "This is a muted olive, low saturation and warm, which falls in your muted earthy avoid range."

### 5.4 Special cases

- White, black, and gray: rate by undertone. A warm cream white scores lower than a true white or cool white for a cool palette. A warm brown black scores lower than a cool black. If undertone cannot be determined from the photo, mark the score as "uncertain undertone" and let the user confirm.
- Patterns: rate the primary colour, and list secondary colours on the item card. The outfit builder must not treat a patterned item as a solid neutral.
- Lighting: warn the user if the photo is very dark or very bright, because colour extraction will be unreliable. Offer to retake in daylight or against a plain wall.
- Manual override: the user can override any auto score with a manual score and a note, for example "looks better in person". The override is stored separately from the auto score, and the outfit builder uses the override when present. The auto score is never overwritten silently.

## 6. Outfit builder (main feature)

### 6.1 Home screen flow

The outfit builder is the first screen after login, not a tab hidden behind the wardrobe.

1. User chooses occasion: Daily, Interview, Formal, Japan travel, Date or evening. Interview and Formal have stricter rules, see section 6.4.
2. User chooses season or weather: Winter, Spring, Autumn, Summer, or Cold, Mild, Warm. This is a manual input in version 1.
3. User chooses vibe, optional: Structured softboy, Clean minimal, Light old money, Streetwear minimal. Default is Structured softboy, from the user's style direction.
4. User taps Build outfits.
5. App generates 3 outfits. Each outfit shows: items with photos, palette scores, fit notes, and a short "why this works" summary.
6. User can: save an outfit, log it as worn today, shuffle one slot (for example, replace only the outer layer), or dislike a combination.
7. A disliked combination is stored and downweighted, not deleted. The same exact combination should not be suggested again for 30 days unless the user explicitly asks for it.

### 6.2 Outfit structure

Every outfit has, at most, one of each slot. Empty slots are allowed if the user has not catalogued that category yet, and the app must say what is missing instead of inventing it.

- Base top: tee, shirt, knit, or sweater, fitted or relaxed as per fit rules.
- Outer layer: cardigan, jacket, coat, or blazer. Optional in warm weather, required in cold weather if available.
- Bottom: trousers, jeans, or chinos.
- Shoes: shoes or boots.
- Accessory: watch with leather band, silver jewelry, belt, or bag. Optional, and limited to one statement accessory plus silver jewelry.

No outfit may contain: two outer layers, two bottoms, two pairs of shoes, or two saturated accent pieces as main colours.

### 6.3 Builder algorithm (rule engine, no paid AI required)

Step 1, Filter:
- Only items with status "in rotation".
- Only items matching the chosen season, or marked all season.
- Only items with palette verdict Perfect, Strong, or Works as neutral or accent only, with the accent rule below. Avoid items are excluded from main slots, and may only appear as a flagged exception if the user explicitly allows avoids for that build.
- For Interview and Formal, only Perfect and Strong items, no "Works as accent only" items in main slots.

Step 2, Anchor:
- Pick a bottom first, preferring a neutral bottom (charcoal, navy, cool black, dark denim) because it makes the rest of the outfit easier to build.
- If no neutral bottom is available, pick the highest scoring bottom and build around it.

Step 3, Build up:
- Pick a base top that contrasts with the bottom in lightness, or is a saturated core colour if the bottom is neutral. Do not pick a top that is the same lightness and same hue family as the bottom, unless the outfit is intentionally monochrome dark, in which case it must include a contrasting accessory or a lighter shoe.
- Pick an outer layer that is a neutral or a darker version of the top colour, and that satisfies the fit rules in section 6.5.
- Pick shoes that match the bottom in darkness and formality, and that fit the wide feet tag if present.
- Pick at most one saturated accent: either the top, the outer, or the accessory, not all three.

Step 4, Score the outfit:
- Palette score: average of item palette scores, weighted by visibility (top and outer count more than shoes).
- Fit score: percentage of fit rules satisfied, see section 6.5.
- Contrast score: does the outfit have clear light and dark contrast, or a clear saturated accent against neutrals, rather than low contrast pastel on pastel.
- Rotation score: prefer items with lower wear count in the last 30 days.
- Total score: weighted sum, with palette and fit weighted highest. Show the breakdown, not just the total.

Step 4, Variety:
- The 3 generated outfits must not share the same base top and outer combination. They should vary the anchor or the accent colour, so the user gets real choices, not the same outfit with different shoes.

Step 5, Explain:
- For each outfit, generate a short explanation from the rules that fired, for example: "Dark charcoal trousers anchor this, the emerald knit gives you the saturated accent, and the navy outer keeps the contrast high. The knit is relaxed in the body, with a fitted tee underneath for the arms."
- Do not generate a generic fashion paragraph. Every sentence must map to a rule, a palette score, or a fit tag.

### 6.4 Occasion rules

Daily:
- Standard rules. Comfort and rotation are weighted higher.

Interview (for example, the Xero values interview):
- Only Perfect and Strong items.
- White or light neutral collared shirt at the front if available, as the base top, unless the user has saved a different interview outfit.
- Dark neutral trousers, dark neutral outer or blazer if available, clean shoes, leather band watch, silver jewelry only.
- No bold patterns, no bright accent as the main colour, no casual hoodies or graphic tees, even if they score well for daily wear.
- The user can save an interview outfit once and reuse it, with a "Wear this interview outfit" shortcut.

Formal:
- Similar to Interview, but allows one saturated core colour as an accent, for example a dark burgundy or plum tie, pocket square, or knit, if catalogued.

Japan travel:
- Prioritise versatile staples that can be worn in multiple outfits, and pieces marked as packable.
- Generate a packing list from saved outfits, with a count of how many outfits each packed piece creates. This is a later addition to the builder, but the data model must support it: an outfit can be marked as "packed for trip" and a trip can have a date range.

### 6.5 Fit and proportion rules (editable, user specific)

These rules are stored as AdviceRule records, not as code constants, so the user can edit them. The starting set below is derived from the user's stated preferences. Each rule has: condition, action (prefer, avoid, require), reason, source, and enabled flag. Source for the starting set is "User stated fit preference" or "User stated style direction".

1. Shoulders first: If category is top or outer, prefer items tagged "structured shoulder" or "fits shoulders", and avoid items tagged "dropped shoulder" or "too tight in shoulders". Reason: size for wide shoulders and large traps first.
2. Base layer arms: If slot is base top, prefer items tagged "fitted sleeve" or "fitted arms". Reason: tighter fit on arms to show muscles, without sizing down the outer layer.
3. Outer body: If slot is outer layer, prefer items tagged "relaxed body" or "loose chest and stomach", and avoid items tagged "tight chest" or "boxy all over". Reason: loose in chest and stomach, but structured at the shoulder, not boxy everywhere.
4. Trouser cut: If category is trousers or jeans, prefer "straight" or "tapered", avoid "very slim" or "skinny". Reason: very slim bottoms make a broad upper body look top heavy, and need room for wide feet and shoes.
5. Sleeve fit: Avoid "billowy sleeve" or "very loose sleeve" for base tops. Reason: loose sleeves hide the arm fit the user prefers.
6. Contrast: Prefer outfits with clear lightness contrast between top and bottom, or a saturated accent against neutrals. Avoid low contrast combinations, especially pastel on pastel, and colours close to skin tone such as camel, tan, and muted olive. Reason: Deep Winter needs high contrast, and low contrast washes out the palette.
7. Colour temperature: Prefer cool colours, avoid warm oranges and warm browns as main colours. Reason: Deep Winter is a cool palette.
8. One detail: Prefer outfits with exactly one soft or romantic detail, for example knit texture, a cardigan, a soft collar, or a subtle pattern. Avoid outfits with three or more competing details. Reason: structured softboy style, one romantic detail per outfit.
9. Jewelry and watch: Prefer silver jewelry over gold, and a leather band watch as the main accessory when occasion allows. Reason: silver fits the cool undertone, and a leather band watch is a priority accessory.
10. Neckline: Prefer open collars, V neck, or unbuttoned collared shirts for base tops when the outer is open, because a high closed crew neck under a closed outer can make large traps and a broad neck look more crowded. This rule is a preference, not a hard filter, and the user can disable it if it does not work in practice. It must be presented as a suggestion with a reason, not as a body judgement.

Rules are suggestions with weights in version 1, except for hard rules in section 6.2 and section 6.4, which are always enforced. A fit rule that is disabled by the user must never affect scoring.

### 6.6 Advice ingestion (version 1 manual, version 2 assisted)

Version 1:
- The user adds advice as a rule in the AdviceRule editor: condition, action, reason, source text or note.
- The user can paste fashion advice text into a notes field attached to a rule, for reference, but the app does not auto parse it in version 1.

Version 2 (planned, not in MVP):
- The user pastes advice text, and a local or free tier model drafts AdviceRule records from it.
- Every drafted rule must be approved, edited, or rejected by the user before it affects the builder.
- Draft rules must show the source sentence they came from, so the user can check for misinterpretation.
- No advice about body shape, skin tone, race, or gender is ever applied without explicit user approval, and the user can delete any such rule permanently. The app must never present a rule as a medical, health, or body correction claim.

### 6.7 Feedback loop

- Save outfit: stores the outfit, its items, its score breakdown, and the occasion.
- Log worn: increments wear count for each item, records the date, and updates cost per wear if price is known.
- Dislike combination: stores the exact item combination, downweights it for 30 days, and asks for an optional reason: palette, fit, comfort, or "just not my style". The reason is used to adjust weights, not to delete items.
- Like outfit: increases the weight of that combination pattern, for example the same bottom and top colour pairing, in future builds.

## 7. Wardrobe grid and item management

- Grid view with photo, category, palette score badge, verdict, season, and fit tags.
- Filters: category, palette verdict, season, fit tag, status, colour family, and search by name or tag.
- Sort: by palette score, by wear count (least worn first), by recently added, or by name.
- Item detail: large photo, dominant colours with percentages, palette score and reason, nearest palette colour, category, season, fit tags, price and cost per wear if entered, wear count and last worn date, status, and outfits this item appears in.
- Edit: user can correct any auto field, add tags, change status, or override the palette score with a note.
- Delete: soft delete first, with an option to restore within 30 days, then permanent delete. Deleting an item must remove it from future outfits but keep past wear logs as "deleted item" so history is not rewritten.

## 8. Data model

Use the following tables or collections. Field names are suggestions, not a requirement, but the relationships must be preserved.

Item:
- id, photoUrl, thumbnailUrl, category, name, dominantColors (array of hex, lab, percentage), primaryColorHex, paletteScore, paletteVerdict, nearestPaletteColorId, autoScore, manualScore, manualScoreNote, season, fitTags (array), status, price, wearCount, lastWornAt, createdAt, updatedAt, location (nullable, for future use only)

Palette, PaletteColor, AvoidRule: see section 4.4.

AdviceRule:
- id, name, conditionCategory, conditionFitTag, conditionColourFamily, action (prefer, avoid, require), weight, reason, source, sourceText, enabled, createdAt

Outfit:
- id, occasion, season, vibe, items (array of itemIds with slot), paletteScore, fitScore, contrastScore, rotationScore, totalScore, explanation (array of strings, one per rule that fired), saved, createdAt

WearLog:
- id, outfitId, itemIds, wornAt, occasion, note

TripPacking (future, model only in version 1):
- id, name, startDate, endDate, outfitIds, itemIds

## 9. Technical architecture (free tier)

### 9.1 Recommended stack

- Frontend: Next.js with TypeScript, Tailwind CSS, and shadcn/ui components. This matches the user's existing stack and the stack used by the Xero TCGo team, which makes it useful as a portfolio project as well as a personal tool.
- Alternative, if the user prefers Vue: Vue 3 with TypeScript and Tailwind. The spec does not depend on React vs Vue, but the team must pick one for version 1 and not mix them.
- App type: PWA. Installable on Android from the browser, works offline for viewing the wardrobe and saved outfits, and syncs when online if a backend is used.
- Backend and database: Supabase free tier for version 1, with Postgres, auth, and storage. For a fully self hosted alternative, PocketBase with SQLite is acceptable and also free, but the team must pick one.
- Photo storage: Supabase Storage or Cloudflare R2 free tier. Compress every photo on upload to a maximum of 1200 pixels on the longest edge and WebP format, with a thumbnail at 400 pixels. Full resolution phone photos must never be stored, because they will exhaust free storage quickly.
- Hosting: Vercel free tier for Next.js, or Cloudflare Pages free tier. Both are sufficient for a single user app.

### 9.2 Free AI and colour processing (no paid API required)

- Background removal: run in the browser using an open source background removal library, for example the @imgly background removal package, or run rembg in Python as a local tool during development. Do not call a paid background removal API for core use.
- Colour clustering: implement k-means in TypeScript in Lab space, or use a lightweight colour extraction library. This runs on the device, no server cost.
- Palette matching: implement Delta E and HSL conversion with a library such as culori or chroma.js. No model call is needed.
- Category tagging: start with manual category selection by the user, with optional zero shot tagging using transformers.js and a CLIP model in the browser. CLIP tagging is an enhancement, not a requirement for version 1, because manual category selection is fast and more accurate than a small model on a phone photo.
- Outfit suggestions: rule engine in TypeScript, as specified in section 6.3. No language model call is required.
- Optional language model: if the user wants chat style suggestions in version 2, use a local model with Ollama on the user's own computer, or a free tier model with strict rate limits. The language model must never be the only source of an outfit, and its suggestions must be filtered through the same palette and fit rules before being shown.

### 9.3 Cost and limits to watch

- Supabase free tier: database rows, storage, and bandwidth are limited. For one user with 200 to 300 items and compressed photos, this should fit, but the team must monitor storage and add a warning when storage reaches 80 percent.
- Vercel free tier: build minutes and bandwidth are limited, again sufficient for one user.
- Google Play publishing: $25 one time fee if the user later wants a native Android listing. This is why version 1 is a PWA, not a Play Store app. Sideloading with Capacitor for personal use is free, but is not required for version 1.
- No feature in version 1 may require a paid API key to work. If a paid service is added later, it must be optional and clearly labelled, and the core palette rating and outfit builder must still work without it.

### 9.4 Privacy

- Photos of clothes are personal data. They must not be sent to a third party AI service by default.
- All colour extraction, background removal, and outfit building in version 1 run on the device or on the user's own Supabase project, not on a shared AI service.
- If a language model is added in version 2, the user must opt in, and the app must state what is sent: item tags and colours, not photos, unless the user explicitly allows photos.
- No social sharing, no public wardrobe, and no analytics that identify individual items to third parties.
- The user can export all data, including photos, palette, items, rules, outfits, and wear logs, as a ZIP file, and can delete the account and all data from the settings screen.

## 10. Screens and user interface

Screens, in order of importance:

1. Outfit Builder (home): occasion, season, vibe selectors, Build button, 3 outfit cards with photos, scores, and why it works, actions: Save, Log worn, Shuffle slot, Dislike.
2. Wardrobe: grid, filters, search, Add item button.
3. Item Detail: photo, colours, palette score and reason, tags, wear history, outfits using this item, Edit, Archive, Delete.
4. Palette: active palette swatches, roles, Upload new PDF, Correction screen, Re rate status.
5. Advice Rules: list of rules with enabled toggle, reason, source, Edit, Add rule, Delete.
6. Saved Outfits: list of saved outfits, with occasion, date saved, and Log worn action.
7. Settings: profile (build, fit, sizes, style direction), palette management, data export, delete account, storage usage.

Design notes:
- Mobile first. The primary device is Android, in portrait orientation, one handed use.
- Palette score badges must be colour blind friendly: do not rely on colour alone. Use score number plus verdict text: Perfect, Strong, Works, Avoid.
- Photos must load fast. Use thumbnails in grids, full images only on detail screens.
- Every destructive action (delete item, delete palette, delete account) requires confirmation.
- Every auto decision (palette extraction, item rating, outfit suggestion) must show its reason and allow correction. No black box decisions.

## 11. Testing and acceptance criteria

### 11.1 Palette ingester tests

- Upload the user's Deep Winter PDF. The ingester must extract at least the core colours royal blue, emerald, rich purple, true red, deep teal, rich plum, dark burgundy, and neutrals charcoal, navy, cool black, and must extract avoid rules for light pastels, warm oranges, and muted earthy hues.
- The ingester must not save any makeup, blush, lip, or hair colour as a clothing palette colour unless the user explicitly adds it.
- The user can correct a wrong swatch in the correction screen and save. The corrected palette is the one used for rating.

### 11.2 Item rating tests

- White collared shirt: Strong neutral, not Avoid.
- Navy sweater: Perfect or Strong.
- Emerald knit: Perfect or Strong.
- Warm orange hoodie: Avoid, with reason mentioning warm orange avoid rule.
- Light pastel tee: Avoid, with reason mentioning pastel avoid rule.
- Muted olive or camel item: Avoid or Works as accent only at most, with reason mentioning muted earthy avoid range.
- Multi colour item with a navy base and a warm orange stripe covering more than 25 percent: score reduced and secondary clash flagged.

### 11.3 Outfit builder tests

- Daily build with a full wardrobe returns 3 outfits, each with a different base top and outer combination.
- Interview build returns only Perfect and Strong items, no hoodies or graphic tees, and prefers a white or light neutral collared shirt if one exists.
- Builder never returns an outfit with two outer layers, two bottoms, or two saturated accents as main colours.
- Builder never returns an archived or stored item for a daily build.
- Disliking a combination prevents the exact same combination from being suggested again for 30 days.
- Logging an outfit as worn increments wear count for every item in that outfit.

### 11.4 Performance and offline tests

- Wardrobe grid with 200 items loads in under 3 seconds on a mid range Android phone on Wi-Fi, using thumbnails.
- Saved outfits and wardrobe grid are viewable offline after first load, even if the builder cannot generate new outfits offline in version 1. If offline generation is supported, state it explicitly, otherwise state the limitation in the UI.
- Photo upload compresses to the limits in section 9.1 before upload, and the user sees a progress indicator.

## 12. Build milestones

Milestone 1, Foundation (estimated 1 weekend, if scoped tightly):
- Project setup: Next.js, TypeScript, Tailwind, PWA manifest, Supabase project, auth for one user.
- Data model from section 8, with migrations.
- Item add, edit, archive, delete, and wardrobe grid with filters, using manual category and colour tags only. No auto rating yet.
- This milestone alone is useful as a digital wardrobe, even before AI features.

Milestone 2, Palette ingester and rating:
- PDF upload, text extraction, page rendering, swatch sampling, correction screen, palette save and versioning.
- Background removal, colour clustering, Delta E rating, avoid rules, score badges, and manual override.
- Re rate all items on palette save.
- Pass all tests in sections 11.1 and 11.2 before moving on.

Milestone 3, Outfit builder (main feature):
- Rule engine from section 6.3, AdviceRule editor with the starting rules from section 6.5, outfit generation, explanation, save, log worn, dislike, and shuffle slot.
- Interview and Formal occasion rules.
- Pass all tests in section 11.3.

Milestone 4, Polish and free tier hardening:
- PWA install, offline viewing, photo compression, storage warning, data export, delete account, accessibility check, and performance check.
- Japan travel packing list, if time allows, otherwise move it to version 2 with the data model already in place.

Do not start Milestone 3 before Milestone 2 passes its tests. An outfit builder on top of wrong palette scores will suggest wrong outfits confidently, which is worse than no builder at all.

## 13. Open decisions (to be confirmed by the user, not assumed by the builder)

1. Confirmed 2026-10-30: Next.js for the frontend, not Vue 3.
2. Confirmed 2026-10-30: Supabase for user, item, and outfit data, with Supabase Storage for images in version 1. PocketBase remains a possible future alternative, but is not the version 1 choice. See section 16 for the full system design.
3. Should the app be strictly single user, or should it support a second profile later, for example for a partner or family member? Version 1 assumes single user.
4. Should cost per wear use purchase price entered manually, or should price be optional and hidden by default? Version 1 assumes optional.
5. Should Japan travel packing be in version 1, or moved to version 2? The spec puts it in Milestone 4 if time allows, otherwise version 2.

## 14. What this spec deliberately does not do

- It does not claim that any specific fashion rule works for every person with a similar build or skin tone. The rules in section 6.5 are the user's stated preferences, stored as editable rules, and the user can disable any of them.
- It does not use the palette PDF's beauty sections to rate clothes.
- It does not require a paid AI service, a Play Store listing, or a social account to use the core features.
- It does not track physical location in version 1, because the user has not decided on a physical organisation system yet. The data model keeps a nullable location field so this can be added later without a rebuild.

## 15. Appendix: Starting palette (from the user's PDF, for testing)

Core: royal blue, emerald green, rich purple, true red, deep teal, rich plum, dark burgundy.
Neutrals: charcoal gray, navy, cool black.
Avoid: light pastels, warm oranges, muted earthy hues.
Jewelry: silver.

These names are for testing the ingester and rating, not a substitute for the ingester itself. The ingester must still extract and sample these from the PDF, and the user must still approve them, because a future palette PDF may have different names, shades, or roles.

## 16. System Design (added 2026-10-30)

This section records the system design agreed with the user on 2026-10-30. It does not replace sections 8 and 9. It makes the choices in those sections concrete: Next.js, Supabase, browser rule engine, and an optional home server LLM in Phase 2 only.

### 16.1 Architecture at a glance

```
Phone / PWA (Next.js)
  |
  | 1. Rule engine runs here, in a Web Worker
  | 2. Image processing runs here, before upload
  |
  v
Next.js on Vercel (UI, API routes, auth session)
  |
  v
Supabase: Auth + Postgres + Storage (private bucket)
  |
  | optional, Phase 2 only, via Tailscale
  v
Home server: Ollama (advisor only, never the decider)
```

### 16.2 Frontend: Next.js

- Framework: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui.
- Hosting: Vercel free tier in version 1.
- App type: PWA, installable on Android from the browser, mobile first, portrait, one handed use.
- Structure: server components for wardrobe grid and item detail, client components for the builder and upload flow.
- Shared logic: the outfit engine is a pure TypeScript library in `lib/outfit-engine/`, importable by the browser and testable in Node. Business logic must not live only inside API routes.
- State: Supabase client in the browser for data reads and writes, with Row Level Security enforcing ownership. No service role key in client code.

### 16.3 Backend and data: Supabase

- Auth: Supabase Auth, single user in version 1, but RLS must still be enforced on `user_id` for every table, so a future second profile does not require a security rewrite.
- Database: Supabase Postgres, 500MB free tier database limit, 1GB free tier file storage limit, projects pause after 1 week of inactivity on the free tier. These limits are acceptable for version 1, with the backup plan in section 16.7.
- Tables, with RLS on `user_id`:
  - `profiles`: id, display name, fit tags, style direction, active palette id
  - `palettes`, `palette_colors`, `avoid_rules`: from the PDF ingester, see section 4
  - `items`: id, user id, category, season, fit tags, status, price, wear count
  - `item_colors`: item id, hex, Lab values, percentage, is primary
  - `advice_rules`: condition, action, weight, reason, enabled
  - `outfits`, `outfit_items`: outfit id, item id, slot, scores, explanation
  - `wear_logs`: outfit id, item ids, worn date, occasion, note
- Precomputation rule: at upload time, calculate and store palette score, dominant colours, colour family, and fit tags. At outfit time, the builder only reads stored numbers. It never processes images. This is what makes a browser rule engine fast and offline capable.

### 16.4 Images: Supabase Storage first, not a separate S3 bucket

Version 1 uses Supabase Storage, which is already S3 under the hood. A separate S3 bucket is intentionally not added in version 1, because it would add a second set of credentials, CORS rules, signed URL logic, and a second bill, with no benefit at this scale.

Storage maths for version 1:
- Compress every photo on upload to a maximum of 1200 pixels on the longest edge, WebP format, about 150 to 250KB per item.
- Thumbnail at 400 pixels, about 30KB per item.
- 300 items: roughly 60 to 75MB total.
- 1,000 items: roughly 230MB total.
- Both are well under the 1GB Supabase free tier storage limit.

Image flow:
1. User uploads a photo in the browser.
2. Browser compresses it, removes the background in a worker, and extracts dominant colours.
3. Browser uploads the compressed photo and thumbnail directly to a private Supabase Storage bucket, using the Supabase client and RLS.
4. Database stores only the storage path, for example `items/<user_id>/<item_id>.webp`, never a public URL.
5. When displaying, the app generates a short lived signed URL and caches it. If a signed URL leaks, it expires, and the bucket is not public.

Storage abstraction (required, even though version 1 uses only Supabase):
- Define a `StorageProvider` interface with `upload(path, file)` and `getSignedUrl(path)`.
- Implement it for Supabase Storage in version 1.
- A future R2 or MinIO implementation must only implement this interface and change configuration. No wardrobe, builder, or UI code may call Supabase Storage or S3 directly outside this provider.

### 16.5 Free storage alternatives, in migration order

Only migrate if the 1GB Supabase limit is actually approached. Do not start with these.

1. Cloudflare R2, best next step: 10GB free storage, 1 million Class A operations and 10 million Class B operations per month, with zero egress fees. It is S3 compatible, so it fits the `StorageProvider` interface. Note that R2 may ask for a payment method on setup even if usage stays in the free tier.
2. Home server MinIO, best self hosted step: free except for the user's own disk, S3 compatible. Cost is uptime, backups, HTTPS, and remote access from the phone when away from home. Access must be via Tailscale, not a public port.
3. AWS S3, avoid for this app: the free tier is 5GB for 12 months only, then paid. That is the opposite of a free forever personal app.

### 16.6 Browser rule engine: pruned beam search, not brute force

A naive builder that tries every combination of tops, outers, bottoms, and shoes explodes combinatorially. With 300 items, full brute force is billions of combinations and must never be implemented.

Version 1 engine, in a Web Worker so the UI does not freeze:

1. Filter: status is in rotation, season matches, palette verdict is Perfect, Strong, or Works as neutral or accent only, and hard occasion rules pass.
2. Anchor: pick the top 10 bottoms by score, preferring neutrals.
3. For each anchor, pick the top 10 compatible tops by contrast and palette, then the top 5 outers, then shoes and accessory.
4. Score each complete outfit: palette score weighted by visibility, fit score from AdviceRule matches, contrast score, and rotation score preferring least worn items.
5. Keep the top 20, then enforce diversity: the final 3 outfits must not share the same top and outer pair.
6. Explain: record which rules fired for each outfit, so the UI can show why it works in plain language.
7. Cache the last build, so shuffling one slot does not rebuild everything.

The engine is deterministic, testable with unit tests, offline capable, and free. That is why it is the core, not a language model.

### 16.7 Backup and free tier risks

- Supabase free tier has no automatic backups, and projects pause after 1 week of inactivity. For a personal app this is acceptable, but the app must have a one tap export to a ZIP file containing items, palette, rules, outfits, wear logs, and photos.
- The user should export before any long period away from the app, for example the Japan trip from November 27 to December 12, 2026, when the project may pause and then resume on return.
- Show storage usage in Settings, with a warning at 80 percent of the free tier limit.
- No feature in version 1 may require a paid API key to work. If a paid service is added later, it must be optional and clearly labelled, and the core palette rating and outfit builder must still work without it.

### 16.8 Home server LLM: Phase 2 advisor only, not in the critical path

The user has a home server. A lightweight local LLM can run on it, but it is overkill for the MVP and must never be in the outfit critical path.

What it is for, in Phase 2 only:
- Parse pasted fashion advice into draft AdviceRule records for the user to approve, edit, or reject.
- Turn a natural language request, for example "smart for an interview but not a full suit", into filters, then let the rule engine build the actual outfits.
- Rewrite a rule based explanation into a smoother sentence, without changing the items chosen.

What it must never do:
- Choose items freely, invent items the user does not own, override a palette avoid, suggest two outer layers, or bypass a fit rule.
- Be the only source of an outfit. Every LLM output must pass through the same palette, fit, and category validator as the rule engine before it is shown. If it fails validation, it is rejected.

Hardware guidance:
- Runtime: Ollama in Docker on the home server.
- Model size: 3B parameters, 4 bit quantisation, for example `llama3.2:3b` or `qwen2.5:3b`.
- RAM: a 3B model wants about 2.5GB free on its own, and a machine with 8GB of RAM is a sensible floor for models up to 3B. A 4 core, 8GB machine runs Llama 3.2 3B at roughly 7 tokens per second, and a faster 16GB machine at roughly 16 tokens per second. That is fine for occasional advice parsing, and not fast or reliable enough for real time outfit generation.
- Keep the model loaded if requests are frequent, or accept a reload delay on first use after idle. Do not try to run a 7B or larger model on a CPU only 8GB server for this app. It will be slow enough to feel broken.

Access and security:
- No public port. The phone and the home server both join Tailscale, and the browser calls the Ollama API directly only when on Tailscale.
- Vercel cannot reach a private Tailscale network, so LLM calls must not be routed through Next.js server code. The browser is the client for the home LLM.
- Put an auth token on the Ollama proxy, rate limit it, and add a feature flag to turn the LLM off entirely.
- Fallback: if the home server is off, asleep, or unreachable, the app works exactly the same, just without the chatty explanation. The user must never see an error because the LLM is down.
- Privacy: in Phase 2, the LLM receives item tags and colours, not photos, unless the user explicitly allows photos. All Phase 1 processing already runs on device or in the user's own Supabase project, not on a shared AI service.

Decision: build Milestones 1 to 3 with rules only, ship it, and use it for a few weeks. Add the home LLM as an optional advisor only if a specific moment is found where rules feel too rigid, for example parsing a long piece of fashion advice. Do not add it before the rule engine passes the tests in section 11.
