// Public editorial descriptions based on the reviewed repositories and supplied documents.
// Examples explain the workflow; they do not expose customer data or claim measured results.
export const stories = {
  'tfc-orders-tracker': {
    headline: 'From an order on a phone to a coordinated kitchen.',
    summary: 'A food operation is a network of handoffs. TFC Orders Tracker connects the people creating an order, planning production, packing items and waiting for delivery, so the next action is easier to see.',
    audience: 'Order administrators, packing teams, production staff and client kitchens.',
    context: [
      'My starting point was practical experience at The Food Company in Kuala Lumpur. As an Outlet PIC / Operations Executive and assistant in ordering administration, I worked around stock, suppliers, production, POS closing and orders arriving through different channels. That experience shaped the questions behind the product: what is still needed, who is working on it, and what can actually leave the kitchen?',
      'A list of orders alone cannot answer those questions. One item may be cooking while another is ready to pack. A shortage changes the plan. Several orders may need the same product. The product therefore follows the work at item level and connects it back to the larger order and production plan.'
    ],
    steps: [
      {title:'Capture the demand',signal:'Order → shared queue',body:'An administrator creates an order with a kitchen, date and product quantities. Items can be entered individually or staged from a pasted message using the documented bulk parser. The important handoff is from an informal request into a structured order that the relevant teams can see.',detail:'Product matching supports entry; a person still needs to check the staged items. Parsing a message is a convenience, not proof that its contents are correct.'},
      {title:'Coordinate production',signal:'Plan → recipe → batch',body:'The daily facility plan brings together products, quantities and linked recipes. Production staff can see ingredients and preparation instructions alongside the work. When several orders require the same product, the documented master-batch workflow groups that production demand.',detail:'Completing a linked batch updates the associated order items to the next preparation state. The model keeps the relationship between shared production and individual orders visible.'},
      {title:'Make the handoff visible',signal:'Cooking → ready → packed',body:'Packing staff work with individual item states: send an item to production, mark it packed, or record a shortage or out-of-stock issue. Those distinctions explain what is happening much more clearly than a single complete/incomplete flag on the entire order.',detail:'The product separates preparing food from packing and dispatching it. A completed production task should not be confused with a completed delivery.'},
      {title:'Close the communication loop',signal:'Dispatch → status update',body:'Once the relevant items are packed, dispatch is confirmed in the workflow. A formatted WhatsApp status export helps communicate the order state, including items still in production and outstanding issues, using the information already recorded by the team.',detail:'Firebase listeners support updates across connected interfaces. Network conditions and correct staff input still matter; the portfolio does not claim zero latency or the removal of all manual coordination.'}
    ],
    features: [
      ['Different views for different work','The documented roles cover administration, packing, production and the two client-kitchen views. Role selection and approval let the interface follow a person’s responsibility instead of showing every control to everyone.'],
      ['Exceptions are part of the workflow','Short stock, unavailable items, notes and quantity changes belong beside the order. Bringing exceptions into the shared record helps explain why an item has not moved forward.'],
      ['A day-level view as well as an order view','Production planning and the dashboard provide a wider perspective. The order remains useful for an individual handoff, while the daily plan helps organise work across orders.']
    ],
    architecture: [
      ['React + TypeScript','The application presents the role-specific workspaces and the order, production and packing interactions. A shared interface model keeps those views connected.'],
      ['Firebase','Shared application records and listeners support the live workflow. Authentication and access configuration are part of the deployment, not a substitute for testing the data rules.'],
      ['Product and recipe structure','Products, quantities and recipe references give the plan operational meaning. The public case study explains that structure without exposing business records or recipe contents.'],
      ['Netlify and supporting documentation','The repository includes a Netlify function, a detailed V8 user guide and visual checks. The guide explains the handoffs a team member needs to understand when using the tool.']
    ],
    reflection: [
      'The key product decision is to model responsibility and state together. A beautiful dashboard means little if the packing team and the production team interpret “done” differently. Clear status language and a visible next action are central to this project.',
      'The next useful validation is an observed operational trial: check how staff handle interrupted connections, corrections, shared devices and busy dispatch periods. Measured impact should come from that work, rather than from a percentage added to a portfolio card.'
    ],
    sourceFiles:['docs/user-guide-v8.html','src/App.tsx','netlify/functions/push.js'],
    takeaway:'Useful software starts by understanding the handoff.'
  },
  'class-tracker': {
    headline:'An everyday workspace with a record you can trace.',
    summary:'Class Tracker TDG puts student administration, attendance and payments into a focused web interface, while keeping Google Sheets as the underlying record. The difficult part is making changes trustworthy, especially when a record needs correcting.',
    audience:'Tuition administrators who manage student records, class attendance and fee payments.',
    context:[
      'A spreadsheet is familiar and useful, but routine administration becomes harder when someone must navigate rows, formulas and separate attendance or payment records to answer a simple question. The product gives those tasks an interface built around students and classes.',
      'The design challenge goes beyond adding forms. A payment can be partial. Attendance can be entered incorrectly. Two browser sessions can open the same record before either saves. The application needs to distinguish a new entry from a correction and make the state of each write clear to the administrator.'
    ],
    steps:[
      {title:'Establish the student record',signal:'Student → permanent identity',body:'Student creation assigns a permanent identifier and connects the student with class enrolment information. Duplicate detection helps catch repeated entry before another record is created. The student profile brings related information into one place.',detail:'Names are useful for people, but a permanent identifier is the safer connection between student, attendance and payment records. A change in display information should not create a different student.'},
      {title:'Record attendance and fees',signal:'Roster → validated entry',body:'Class rosters support batch attendance recording. Payment transactions support partial payments and guard against overpayment in the documented implementation. These are distinct administrative actions with their own validation.',detail:'A write travels through a Netlify Function to the Sheet. The interface must not report success merely because it changed something locally while the underlying write failed.'},
      {title:'Correct without losing context',signal:'Record version + reason',body:'Correction flows ask for a reason and carry the version of the record that the administrator opened. If the source has changed, a stale correction is rejected so the current information can be loaded before trying again.',detail:'This is optimistic concurrency: two people can read the same record, but the second save should not silently replace the first. An explicit conflict is more useful than an apparently successful lost update.'},
      {title:'Review the history',signal:'Saved records → reports',body:'Student profiles, history and reports bring the underlying records back into the web workspace. They help an administrator review what was recorded and understand changes without switching to raw spreadsheet rows for every task.',detail:'Reporting is only as reliable as the records underneath it. Audit information and clear correction behaviour support the report; they are not decorative extras added after the main screens.'}
    ],
    features:[
      ['Student-centred administration','Permanent IDs, enrolment information, duplicate checks and student profiles organise the work around a person. Attendance and fees can then refer to the same record consistently.'],
      ['Payment detail that reflects real administration','A fee is not always paid in one transaction. Partial payments, correction and voiding paths make the model more useful than a single paid/unpaid switch.'],
      ['Server-owned business writes','Google credentials remain on the server. The browser sends a request; the backend checks it and performs the Sheets operation. Failed writes must remain visible as failures.']
    ],
    architecture:[
      ['React + TypeScript + Vite','The frontend contains the administration shell, student forms, profiles and dedicated attendance, payment, report and history views.'],
      ['Netlify Functions','Endpoints validate inputs and coordinate student, attendance and payment operations. Correction endpoints retain reasons and guard against stale record versions.'],
      ['Google Sheets as authority','A server-side service account talks to the Sheets API. The documented write engine uses explicit row operations, keeping business records in the agreed workbook structure.'],
      ['Authentication boundary','The development authentication path is restricted to staging. Production identity and access configuration must be completed and validated before a client launch.']
    ],
    reflection:[
      'The most meaningful design work is often in the uncomfortable states: a duplicate, a rejected correction, an interrupted save or a payment that does not match the expected amount. Giving those states clear language is part of making the tool approachable.',
      'The next release gate is production identity configuration followed by an end-to-end administrator trial against the intended workbook. The repository is active development, and the case study does not present it as an independently audited, launched school service.'
    ],
    sourceFiles:['README.md','netlify/functions/attendance-item.mts','netlify/functions/payment-item.mts','netlify/functions/reports.mts'],
    takeaway:'Trust is built into the correction, not just the first save.'
  },
  'second-brain': {
    headline:'A knowledge system that begins with your own files.',
    summary:'Second Brain explores an Android-first workspace for connected knowledge. Its central decision is simple: the local Markdown vault is the durable source, while the database and graph help you work with it.',
    audience:'People who want a portable personal knowledge workspace, with local ownership and connected notes.',
    context:[
      'Capturing an idea is easy. Keeping it useful as a collection grows is harder. Notes acquire links, structure and context; titles change; files move. A knowledge tool should help with that complexity without making the application the only way to reach the original material.',
      'Second Brain starts from a local vault containing Markdown and structured metadata. The application can add richer editing and discovery around those files, but the stored thought should remain understandable outside the interface. That choice shapes the editor, the identity model and the graph.'
    ],
    steps:[
      {title:'Capture a knowledge object',signal:'Content + stable identity',body:'The workspace models notes and related knowledge objects with stable identifiers. A title helps a person recognise an object; its identity provides a reliable reference when it is renamed, moved or linked elsewhere.',detail:'The reviewed build work includes template selection, editor flows and structured linking. The aim is to make capture approachable while keeping a consistent object model underneath it.'},
      {title:'Write to the local vault',signal:'Markdown + frontmatter',body:'The vault writer is the persistence boundary. Text and metadata are written to the local files, so the vault remains the canonical record of the knowledge rather than a disposable export produced by a database.',detail:'Frontmatter round trips, external edits and Android storage permissions are real engineering concerns. Preserving what is already on disk matters as much as making a new note look correct in the editor.'},
      {title:'Build a useful index',signal:'Files → rebuildable SQLite',body:'SQLite supports discovery and relationships around the vault. Its role is to make the local material easier to query and navigate, with rebuild and repair paths that recover the derived structures from the durable source.',detail:'A rebuildable index separates convenience from ownership. Deleting a cache should not delete the only copy of someone’s thinking.'},
      {title:'Explore the connections',signal:'Explicit links → graph view',body:'The graph provider builds a view over stored relationships. The reviewed graph work separates the engine from the screen and bounds the additional similarity calculations as the collection grows.',detail:'Explicit links and inferred similarity answer different questions. The architecture keeps the recorded relationship model separate from an optional suggestion that two objects may be related.'}
    ],
    features:[
      ['Writing and structure in the same workspace','The reviewed editor work includes rich editing, source mode, formatting and identity-aware wiki links. Those interactions sit on top of the file format instead of replacing it with an opaque document store.'],
      ['Relationships that survive routine changes','Stable object identity is designed to preserve links through rename and move operations. The project’s validation work also covers hierarchy, deletion and restoration.'],
      ['A graph that can grow with the vault','The provider separates relationship computation from rendering. Bounded similarity work and performance fixtures address the cost of comparing large collections.']
    ],
    architecture:[
      ['React Native + Expo','The mobile interface and Android-first workflows shape capture, editing and navigation. This is an application prototype, not a browser-only notes page.'],
      ['Markdown + YAML metadata','The vault stores readable content and structured properties. Compatibility and careful round trips matter because those files may be used outside this application.'],
      ['SQLite and relationship records','Derived indexes and explicit edges support discovery and graph views. Rebuild and repair behaviour help keep those structures connected to the vault.'],
      ['GraphProvider boundary','The provider exposes graph data independently of the screen. The reviewed project state records the provider and performance harness as landed, with later graph work still in progress.']
    ],
    reflection:[
      'Ownership is an architectural decision. An export button helps, but it is different from making portable files the source of truth throughout the product. That decision creates more engineering work around identity and storage, and it is the core of this project.',
      'The recorded Android storage-access fix still requires device verification, and the larger graph programme is unfinished. The next valuable proof is reliable capture, edit and recovery on an actual device, alongside a graph that stays useful as the vault grows.'
    ],
    sourceFiles:['PROJECT_STATE.md','src/bridge/VaultWriter.js','src/graph/GraphProvider.js','src/linking/VectorStore.js'],
    takeaway:'The application should enrich the thought, without owning it.'
  },
  'banu-2': {
    headline:'A voice conversation with a deliberate path to action.',
    summary:'Banu 2.0 is a personal voice-assistant experiment connecting a Flutter client with a Python backend. It explores how speech, model responses and defined tools can work together inside a bounded interaction.',
    audience:'A single user exploring conversational assistance through an Android client.',
    context:[
      'A voice interface is a sequence of systems, not one model call. Audio must be received, transcribed and interpreted; a tool may be requested; the result must return to the conversation; and the answer must become speech. Failure in any one of those stages changes the whole experience.',
      'The project explores that sequence as an explicit orchestration problem. The backend coordinates the turn, while the mobile client handles the user-facing interaction. The current system is designed around one user, which is an important boundary of the experiment.'
    ],
    steps:[
      {title:'Bring the voice into the turn',signal:'Android → WebSocket',body:'The Flutter Android client communicates with the FastAPI backend over WebSockets. Speech recognition provides the text that the conversation layer can work with, separating the audio interaction from the reasoning and tool logic.',detail:'Wake-word handling and the conversational backend are distinct concerns. The repository describes client-side wake-word handling; a cloud server does not have access to a local microphone just because a microphone module exists in the codebase.'},
      {title:'Choose a response path',signal:'Transcription → model routing',body:'The backend connects the transcribed request with the model layer. The project explores local and cloud routing, making provider choice a backend concern rather than something every client screen needs to implement.',detail:'A local model option does not make the complete phone-to-server system fully offline. Connectivity, speech services and provider configuration still determine what can actually run in a given setup.'},
      {title:'Use explicitly defined tools',signal:'Bounded orchestration loop',body:'Tools have defined schemas and control logic. The conversation loop limits its rounds and uses a shared time budget, so one request cannot expand indefinitely into more model and tool calls.',detail:'A tool schema says what an action looks like; the application must still validate the request and handle failures. The implementation includes turn-state cleanup when execution fails rather than treating every partial turn as complete.'},
      {title:'Return an understandable answer',signal:'Tool result → spoken response',body:'Tool results can return to the conversation before the response is converted into speech. Keeping the turn coordinated on the backend provides one place to manage the handoff between model output, tool execution and audio.',detail:'The prototype also explores webcam-derived emotion context. That process-wide context is one reason the current backend must be described as single-user rather than as a service for unrelated users.'}
    ],
    features:[
      ['Conversation can connect to an action','The tool layer creates a controlled vocabulary between a model’s proposed action and the application’s executable capabilities. It provides a place to inspect and bound that relationship.'],
      ['A backend with responsibility for the whole turn','Speech, routing, tools and response generation have different failure modes. Central orchestration gives the interaction a shared lifecycle and budget.'],
      ['Exploration with visible deployment limits','The repository records production-secret requirements, origin configuration and persistence concerns. Those details matter when an experiment moves from a laptop to a hosted backend.']
    ],
    architecture:[
      ['FastAPI + Python','The backend coordinates speech recognition, model calls, tool execution and text-to-speech. The control layer defines the actions the loop understands.'],
      ['Flutter + WebSockets','The Android client is a separate interface connected to the conversation backend, allowing the interaction layer and orchestration to develop independently.'],
      ['Local and cloud model paths','Routing experiments include local inference and hosted providers. The available path depends on the configured environment; it is not a promise of universal offline operation.'],
      ['Personal state and persistence','The documented memory files require durable storage on an ephemeral host. Process-wide visual context also needs redesign before a multi-user architecture would be appropriate.']
    ],
    reflection:[
      'The useful design question is not only “can the assistant do this?” It is also how a turn ends, how a failed action is explained and what information belongs to this user. Boundaries are part of the product experience.',
      'The next validation should examine complete turns on a real phone: interrupted audio, slow providers, failed tools, reconnection and persisted personal state. Banu 2.0 remains an experimental single-user system, with those concerns clearly separated from a future public service.'
    ],
    sourceFiles:['README.md','FastAPI application and conversation loop','Control tool definitions','Flutter Android client'],
    takeaway:'A capable assistant also needs a clear stopping point.'
  },
  'veloria': {
    headline:'A family of creative ideas, connected by a shared identity.',
    summary:'VELORIA is a brand and operating framework for creative work across photography, publishing, personal growth, technology, learning and digital products. The challenge is to connect those interests without making every voice feel identical.',
    audience:'The creative team and the different audiences each VELORIA division is intended to serve.',
    context:[
      'A portfolio of ideas needs more than a collection of logos. It needs a clear relationship between the parent identity and each division, a sense of what belongs where, and practical standards for producing and approving work.',
      'The supplied July 2026 Company Bible establishes VELORIA’s foundation. Its “Evolve Beyond” direction connects six endorsed divisions. Akashna leads VELORIA as CEO; my contribution spans social media strategy, production, visual communication and operations. This case study reflects that collaborative structure.'
    ],
    steps:[
      {title:'Define the shared promise',signal:'VELORIA → Evolve Beyond',body:'The parent brand provides a common direction and a recognisable endorsement. It gives the different creative activities a relationship to one another without requiring them to share one subject or format.',detail:'The parent identity acts as a frame. The question for each division is what it contributes to that frame and why someone would choose to follow that particular voice.'},
      {title:'Give each division a purpose',signal:'Six disciplines → six voices',body:'Studio connects to The Daily Gaze; Publishing to Clouds; Mind to Aura; Tech to The Grid; Learn to Roots; and Store to The Collection. Each division addresses a different kind of creative work.',detail:'Photography, fiction and learning should not sound like interchangeable posts. A clear purpose helps decide the subject, tone and format before visual styling begins.'},
      {title:'Build a recognisable family',signal:'Identity → applications',body:'The supplied brand suites explore logos, colour, profile images, covers and watermarks. The endorsement links the individual identities back to VELORIA while leaving room for a distinct atmosphere in each division.',detail:'These are concept directions from the supplied foundation pack. Final vector production, small-size testing and application consistency remain part of developing the identity system.'},
      {title:'Connect the identity to the work',signal:'Brief → production → review',body:'The company bible connects the visual framework to content workflows and approval responsibilities. A useful brand system should guide what gets made, who prepares it and how it is reviewed, as well as what it looks like.',detail:'The public portfolio shows the framework and selected supplied visual studies. It does not present the six divisions as six independently established businesses or publish internal operating documents.'}
    ],
    features:[
      ['A photographic voice: The Daily Gaze','The Studio division centres on photography and observation. My first-party photographic journal gives that part of the wider creative practice a concrete place in this portfolio.'],
      ['Stories, reflection and learning','Clouds, Aura and Roots distinguish fiction and storytelling, personal growth, and learning. Separate purposes let each develop a voice that fits its audience.'],
      ['Technology and digital products','The Grid and The Collection provide homes for technology-focused work and digital products. Their relationship to VELORIA is shared, while their subject matter and delivery can differ.']
    ],
    architecture:[
      ['Parent identity','VELORIA carries the shared name and “Evolve Beyond” direction. The endorsement establishes the relationship between the parent and the divisions.'],
      ['Division map','Studio, Publishing, Mind, Tech, Learn and Store describe the organisational structure. Their public-facing brand names make that structure more expressive.'],
      ['Visual applications','The supplied pack includes seven brand suites along with profile images, covers and watermarks. These show how the identities were explored across common touchpoints.'],
      ['Operating framework','The company bible places creative direction alongside workflow and approval roles. The practical ambition is consistency in both the output and the way it is made.']
    ],
    reflection:[
      'The central design tension is family resemblance versus individuality. If every division looks and speaks the same, the distinctions lose meaning. If they share nothing, VELORIA becomes only a name above unrelated projects.',
      'The next step is to turn the foundation into tested applications: finalise the vector identities, check their smallest uses and produce a focused set of real content. A framework becomes convincing through consistent work, not through the number of divisions drawn on a page.'
    ],
    sourceFiles:['VELORIA Company Bible v1.0 · Foundation Edition, July 2026','Supplied brand suites, profile images, covers and watermarks'],
    takeaway:'A shared identity should create room for distinct voices.'
  }
};

export const education = [
  {title:'Diploma in Graphic Designing',school:'YES College, Malaysia',years:'2023–Jun 2026',detail:'Diploma study in visual communication, creative practice and design development.'},
  {title:'Advanced Diploma in Graphic Designing',school:'NSBM Green University, Sri Lanka',years:'2022–2023',detail:'Advanced study in communicating ideas through visual design, supported by the supplied qualification.'},
  {title:'Foundation in Software Engineering',school:'Curtin University',years:'2022–2023',detail:'Foundation study in software engineering and information technology, alongside my interest in building digital tools.'},
  {title:'G.C.E. O/L',school:'Thurstan College, Colombo 07',years:'2011–2021',detail:'My school years in Colombo, before moving into graphic design, software foundations and professional work.'}
];

export const perspectives = [
  {id:'operations',title:'The operator',subtitle:'Understand the real work.',image:'portrait',body:'Working in an outlet means paying attention to people, timing and the details that hold a day together. Team coordination, stock, suppliers, production and order handling gave me a practical view of how small gaps between tasks become larger problems.',connection:'That experience feeds directly into TFC Orders Tracker: organise the handoff, make the next action clear and keep exceptions visible.',link:'/work/tfc-orders-tracker/',linkText:'Inside the operations project'},
  {id:'design',title:'The designer',subtitle:'Make the message clear.',image:'about',body:'My design work spans logo design, education-related communication and advertising. It taught me to consider what someone sees first, what they need to understand next and how a visual choice supports the message.',connection:'VELORIA brings that thinking into a wider identity system, where distinct creative voices need a recognisable relationship.',link:'/work/veloria/',linkText:'Explore the identity system'},
  {id:'product',title:'The builder',subtitle:'Turn a question into a tool.',image:'portrait',body:'Building products gives me a way to work on the problems I notice. My projects explore operational visibility, student administration, local knowledge and voice assistance. Each asks a different question about how software can support everyday work.',connection:'I use AI-assisted development as part of the process, with the product direction, source review and validation still needing deliberate human judgement.',link:'/work/second-brain/',linkText:'Explore a knowledge workspace'},
  {id:'photography',title:'The observer',subtitle:'Give the ordinary another look.',image:'personal',body:'Photography is another way of paying attention. The Daily Gaze collects light, streets, nature, heritage and everyday details from Sri Lanka and Malaysia. It gives the quieter, more observational side of my work its own space.',connection:'The same habit connects the camera with design and product work: notice what is there before deciding what to add.',link:'/daily-gaze/',linkText:'Step into The Daily Gaze'}
];
