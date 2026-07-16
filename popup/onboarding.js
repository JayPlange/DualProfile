/**
 * DualProfile i18n — 8 languages
 * Stored in localStorage as 'dp_lang', defaults to 'en'
 */
const DP_I18N = {
  en: {
    lang_label: 'Language',
    headline: "You already change how you talk depending on who's listening.",
    headline_bridge: "Your photo doesn't. Turns out people have wanted this for years:",
    now_exists: 'Now it exists.',
    sub: 'Assign different photos to different contacts — your boss sees one, your friends see another. Switched automatically. Same number, same WhatsApp.',
    free_to_start: 'Free to start',
    works_on_web: 'Works on WhatsApp Web',
    two_minutes: '2 minutes to set up',
    show_me: 'Show me how',
    pair_title: 'DualProfile works between two people.',
    pair_sub: "When you assign someone a photo, they need DualProfile too — that\'s what makes it real, not a simulation. Send them the link now, before you finish setup.",
    copy_link: '📎 Copy install link to send them',
    copied_msg: 'Copied — paste it in WhatsApp and keep going',
    p2p_reminder_msg: '{name} will see this once they install DualProfile too.',
    continue_setup: 'Continue setup',
    invite_later: "I\'ll invite them later",
    upload_title: 'Upload your two photos.',
    upload_sub: 'One for work. One for everything else.',
    phone_title: 'Enter your WhatsApp number.',
    phone_sub: 'This links your photos to your WhatsApp identity so contacts with DualProfile can see the right photo.',
    refresh_title: 'Refresh WhatsApp Web.',
    refresh_sub: 'This activates DualProfile inside WhatsApp and lets it detect your contacts.',
    assign_title: 'Assign photos to contacts.',
    assign_sub: 'Assign Photo 1 or Photo 2 to each contact. You can change this any time from the Contacts tab.',
    live_title: "You\'re live.",
    live_sub: 'The moment your contact installs and registers, your assigned photo appears on their screen automatically.',
    open_wa: 'Open WhatsApp Web',
    copy_share: 'Copy install link to share',
    copy_share_confirm: 'Copied — paste it to your contact on WhatsApp',
    // Step 3 — Upload Photos
    step_badge_1of3: 'Step 1 of 3',
    upload_title2: 'Upload your two photos',
    upload_sub2: 'One for work. One for life. You decide who sees which.',
    upload_note: 'You only need one photo to continue — add the second later.',
    upload_photo1_label: 'Photo 1',
    upload_photo2_label: 'Photo 2',
    upload_tap: 'Tap to upload',
    upload_hint1: 'e.g. professional, work headshot',
    upload_hint2: 'e.g. personal, casual, real you',
    upload_error: 'Upload at least one photo to continue.',
    upload_too_large: 'That image is too large. Please use one under 5MB.',
    upload_continue: 'Continue',
    // Step 4 — Phone Number
    step_badge_2of3: 'Step 2 of 3',
    phone_title2: 'Register your WhatsApp number',
    phone_sub2: 'This is how other DualProfile users recognise you — and how your assigned photo reaches their screen automatically.',
    phone_note: "Include your country code. Your number is never stored directly — it\'s converted to a private secure code instantly.",
    phone_error: 'Please enter a valid number with country code.',
    phone_save: 'Save & continue',
    phone_skip: "I\'ll do this later",
    phone_saving: 'Saving...',
    phone_warn_title: "Before you skip — here\'s what you\'ll lose",
    phone_warn_li1: "Other DualProfile users won\'t know you\'re on the network — they\'ll see an Invite button instead of your profile.",
    phone_warn_li2: "Your assigned photos won\'t sync to contacts in real time.",
    phone_warn_li3: 'Without your number, DualProfile is only half working for you.',
    phone_warn_register: 'Register my number',
    phone_warn_skip: 'Skip for now',
    // Step 5 — Refresh WhatsApp
    refresh_title2: 'Refresh your WhatsApp Web tab',
    refresh_sub2: 'This activates DualProfile inside WhatsApp and lets it detect your contacts.',
    refresh_step1: 'Switch to your WhatsApp Web tab',
    refresh_step2: 'Press F5 or Ctrl + R · Mac: Cmd + R',
    refresh_step3: 'Come back here and tap Continue',
    refresh_done: 'Done — continue',
    refresh_not_open: "WhatsApp isn\'t open right now",
    // Step 6 — Assign Contacts
    step_badge_3of3: 'Step 3 of 3',
    assign_title2: 'Who sees which photo?',
    assign_sub2: 'Assign Photo 1 or Photo 2 to each contact. You can change this any time from the Contacts tab.',
    assign_scroll_title: 'One thing before we load your contacts',
    assign_scroll_sub: 'Switch to your WhatsApp Web tab and scroll down through your chats — this ensures all your contacts are loaded.',
    assign_load_btn: 'Done — load my contacts',
    assign_photo1_legend: 'Your first photo',
    assign_photo2_legend: 'Your second photo',
    assign_loading: 'Loading contacts from WhatsApp...',
    assign_no_contacts: 'No contacts found. Go to WhatsApp Web, scroll through your chats, then tap Retry.',
    assign_retry: 'Retry',
    assign_finish: 'Finish setup',
    assign_skip: "I\'ll assign contacts later",
    assign_free_limit: 'Free plan: up to',
    assign_free_contacts: 'contacts.',
    assign_upgrade: 'Upgrade to Pro →',
    // Step 7 — You're Live
    live_badge_active: '● LIVE',
    live_badge_almost: '⚠ Almost there',
    live_title_full: 'From now on, every person sees exactly who you want them to see.',
    live_title_almost: 'Almost ready — one step remaining.',
    live_will_see_p1: 'Will see your Photo 1 ✓',
    live_will_see_p2: 'Will see your Photo 2 ✓',
    live_no_assign: 'Your photos are ready. Assign contacts any time from the Contacts tab.',
    live_check_photos: 'Photos uploaded',
    live_check_registered: "You're live on the DualProfile network",
    live_check_not_registered: 'Number not registered —',
    live_fix_this: 'fix this →',
    live_warn_detail: "Without your number, contacts see an Invite button instead of your photo, and real-time sync won\'t work.",
    live_fully_active: 'DualProfile fully active',
    live_partly_active: 'DualProfile partially active',
    live_nudge: 'Need more than 2 contacts?',
    live_upgrade: 'Upgrade to Pro →',
    live_network_title: 'Important — how DualProfile works',
    live_network_body: 'For a contact to see your assigned photo, they also need DualProfile installed. Once they do, your photo appears on their screen automatically — no extra steps.',
    live_copy_link: 'Copy install link to share',
    live_copied: 'Copied — paste it to your contact on WhatsApp',
    live_continue: 'Continue',
    // Popup UI
    tab_preview: 'Preview',
    tab_photos: 'Photos',
    tab_contacts: 'Contacts',
    tab_settings: 'Settings',
    status_active: 'Extension Active',
    status_disabled: 'Extension Disabled',
    preview_hero_title: 'Live Simulation',
    preview_hero_sub: 'See exactly how different people see you on WhatsApp',
    preview_label: 'Preview as:',
    preview_select: 'Select a contact...',
    preview_hint: 'Your WhatsApp profile updates live as you switch contacts',
    preview_exit_btn: 'Exit Preview',
    preview_no_photo: 'Upload photos first, then select a contact above',
    preview_go_photos: 'Upload photos →',
    invite_choose_style: 'Choose your style:',
    invite_copy_btn: 'Copy message',
    invite_wa_btn: 'Send on WhatsApp →',
    photo_click_upload: 'Click to upload',
    photo1_label: 'Photo 1',
    photo2_label: 'Photo 2',
    photo_default_label: 'Default photo for unlisted contacts:',
    photo_live_preview: 'Live Preview',
    photo_preview_desc: 'See your profile photo change in WhatsApp Web:',
    photo_preview_select: 'Select contact...',
    photo_preview_as: 'Preview as:',
    exit_preview_mode: 'Exit Preview Mode',
    contacts_loading: 'Loading contacts from WhatsApp...',
    contacts_open_wa: 'Open WhatsApp Web to see contacts',
    contacts_used: 'Free tier:',
    contacts_upgrade: 'Upgrade to Pro',
    quick_switch: '⇄ Quick Switch',
    history_btn: '📋 History',
    select_contact: 'Select contact...',
    register_now: 'Register now →',
    save_number: 'Save Number',
    settings_appearance: 'Appearance',
    settings_theme: 'Theme',
    settings_theme_desc: 'Choose your preferred color scheme',
    settings_preview: 'Preview',
    settings_test: 'Test Your Setup',
    settings_test_desc: 'Preview how contacts will see your photos',
    settings_tutorial: 'Tutorial',
    settings_replay: 'Replay Onboarding',
    settings_replay_desc: 'Watch the setup tutorial again',
    settings_replay_btn: 'Replay',
    settings_data: 'Data',
    settings_clear: 'Clear All Data',
    settings_preview_btn: 'Preview',
    copied_btn: 'Copied!',
    switching: '⇄ Switching…',
    switched: '✓ Switched!',
    no_contacts_wa: 'No contacts found. Make sure WhatsApp Web is loaded.',
    contacts_load_err: 'Could not load contacts. Try refreshing WhatsApp Web.',
    activating_preview: 'Activating preview...',
    open_wa_first: 'Open WhatsApp Web first to use preview.',
    preview_failed: 'Preview failed.',
    no_wa_connect: 'Could not connect to WhatsApp Web.',
    confirm_clear: 'Clear all data? This cannot be undone.',
    number_mismatch: "Your registered number doesn't match the WhatsApp account currently open. Assignments may not reach your contacts.",
    update_number: 'Update number',
    how_to_refresh: 'How to refresh',
    refresh_instructions: 'Press F5 (or Cmd+R on Mac) on your WhatsApp Web tab, then reopen this popup.',
    waiting_refresh: 'Waiting for refresh…',
    wa_active: '✓ Active',
    wa_open_first: 'Open WhatsApp Web first',
    number_mismatch: "Your registered number doesn't match the WhatsApp account currently open. Assignments may not reach your contacts.",
    reddit_meta1: 'r/whatsapp · 9 years ago',
    reddit_q1: '"Is there a way to display different profile pictures to different people?"',
    reddit_a1: 'Top answer: Nope.',
    reddit_meta2: 'r/whatsapp · 5 years ago',
    reddit_q2: '"Different profile picture between web and app — is it possible?"',
    reddit_a2: 'Top answer: Only if you have two phone numbers.',
    reddit_meta3: 'r/whatsapp · 8 months ago',
    reddit_q3: '"WhatsApp should support multiple profile photos."',
    reddit_a3: 'Top answer: [deleted]',
    tagline: 'Different photos for different people',
    help_btn: 'Help',
    upgrade_title: 'Upgrade to DualProfile Pro',
    upgrade_limit_msg: "You've reached the free limit (2 contacts).",
    upgrade_monthly: 'Monthly — £9.99/mo',
    upgrade_annual: 'Annual — £59/yr',
    tag_annual: 'Annual',
    tag_lifetime: 'Lifetime',
    upgrade_lifetime: 'Lifetime — £79 once',
    upgrade_payment_note: 'Secure payment via Lemon Squeezy.',
    upgrade_license_label: 'Already purchased? Enter your license key:',
    upgrade_activate: 'Activate',
    upgrade_validating: 'Validating license...',
    upgrade_license_err: 'Please enter your license key',
    upgrade_close: 'Close',
    upgrade_coming_soon_badge: '🚀 Coming Soon!',
    upgrade_coming_soon_msg: 'Pro features will be available after Chrome Web Store launch.',
    upgrade_email_placeholder: 'Enter email for early access',
    upgrade_notify_btn: 'Notify Me',
    upgrade_signup_note: "Be the first to know when Pro launches!",
    upgrade_on_list: "You're on the list!",
    upgrade_already_on_list: "You're already on the list!",
    upgrade_email_confirm: "We'll email you at:",
    upgrade_launch_note: "when Pro features launch.",
    upgrade_notify_note: "We'll notify you when Pro launches.",
    lets_go: "Let's go",
    pro_features_title: 'Plans & Features',
    pro_unlimited_title: 'Unlimited Contacts',
    pro_unlimited_desc: 'Assign to as many contacts as you want',
    pro_quickswitch_title: 'Quick Switch',
    pro_quickswitch_desc: 'Flip all P1 ⇄ P2 in one tap',
    pro_history_title: 'Assignment History',
    pro_history_desc: 'Full log of every change',
    pro_support_title: 'Priority Support',
    pro_support_desc: 'Direct email access to the team',
    pro_workmode_title: 'Work / Personal Mode',
    pro_workmode_desc: 'Coming soon',
    pro_photohistory_title: 'Photo History & Revert',
    pro_photohistory_desc: 'Restore any of your last 3 uploaded photos',
    feat_bulk_title: 'Bulk Contact Assignment',
    pro_schedule_title: 'Scheduled Photos',
    pro_schedule_desc: 'Auto-switch photos by day and time',
    pro_export_title: 'Export & Import Assignments',
    pro_export_desc: 'Backup and restore all your contact assignments',
    pro_multidevice_title: 'Multi-Device Sync',
    pro_multidevice_desc: 'Your preferences sync across all your devices',
    // History panel strings
    history_panel_title: 'Photo History',
    history_slot1: 'Photo 1 history',
    history_slot2: 'Photo 2 history',
    history_restore_btn: 'Restore',
    history_empty: 'No history yet — previous photos will appear here',
    history_restored_toast: 'Photo restored successfully',
    history_pro_gate: 'Photo history is a Pro feature',
    // Schedule panel strings
    schedule_panel_title: 'Scheduled Photos',
    schedule_enable_label: 'Enable schedule',
    schedule_photo_label: 'Active photo during window',
    schedule_days_label: 'Active days',
    schedule_start_label: 'Start time',
    schedule_end_label: 'End time',
    schedule_save_btn: 'Save schedule',
    schedule_saved_toast: 'Schedule saved',
    schedule_pro_gate: 'Scheduled photos is an Annual feature',
    schedule_day_sun: 'Sun',
    schedule_day_mon: 'Mon',
    schedule_day_tue: 'Tue',
    schedule_day_wed: 'Wed',
    schedule_day_thu: 'Thu',
    schedule_day_fri: 'Fri',
    schedule_day_sat: 'Sat',
    schedule_active_badge: 'Schedule active',
    // Export/import strings
    export_btn: 'Export assignments',
    import_btn: 'Import assignments',
    export_success_toast: 'Assignments exported',
    import_success_toast: 'Assignments imported successfully',
    import_error_toast: 'Invalid file — could not import',
    export_pro_gate: 'Export & import is a Lifetime feature',
    unlock_pro: 'See plans — from £9.99/mo',
    unlock_annual: 'Unlock Annual — £59/yr · Bulk assign',
    bulk_mode_label: 'Bulk select',
    bulk_assigned_p1: 'Assigned to Photo 1',
    bulk_assigned_p2: 'Assigned to Photo 2',
    bulk_teaser: 'Select all your work contacts at once. Annual plan.',
    coming_soon: 'Coming soon',
    history_contacts_flipped: 'contacts flipped',
    history_removed: 'removed',
    help_title: 'How to Use DualProfile',
    help_li1: 'Upload 2 different profile photos',
    help_li2: 'Go to Contacts tab and assign contacts to each photo',
    help_li3: 'Contacts assigned to Photo 1 will see Photo 1',
    help_li4: 'Contacts assigned to Photo 2 will see Photo 2',
    help_li5: 'Use Live Preview to test how it looks!',
    help_free_title: 'Free Tier',
    help_free_desc: 'You can assign up to 2 contacts for free. Upgrade to Pro for unlimited contacts.',
    help_trouble_title: 'Troubleshooting',
    help_trouble_desc: "If contacts don't load, make sure WhatsApp Web is open and fully loaded. Try scrolling your chat list first.",
    preview_setup_title: 'Preview Your Setup',
    preview_setup_desc: 'This is how your contacts will see your photos:',
    preview_no_photo_label: 'No photo',
    preview_close: 'Close',
    waiting_for_install: 'Waiting for',
    to_install: 'to install…',
    p2p_sync_active: 'P2P sync active',
    sync_inactive: 'Inactive',
    sync_not_configured: 'Not configured - set Convex/Cloudinary in config.js',
    enter_phone_for_sync: 'Enter your phone number to enable P2P sync',
    number_saved: '✓ Number saved! P2P sync is now active.',
    change: 'Change',
    wa_is_active: 'DualProfile is active',
    sync_is_live: 'Sync is live. You can now assign photos to contacts.',
    no_photo_assignment: 'No photo uploaded for this assignment.',
    no_history_found: 'No history found.',
    one_more_step: 'One more step',
    hard_refresh_msg: 'Hard refresh WhatsApp Web now so DualProfile can activate. Press Ctrl+Shift+R (Mac: Cmd+Shift+R) on your WhatsApp tab.',
    upgrade_working_title: "They can see you. 🎉",
    upgrade_working_sub: 'Your first assigned contact now sees exactly the photo you chose for them. Want all your contacts to see the right version of you?',
    upgrade_working_cta: 'Unlock all contacts',
    upgrade_limit_msg_1: 'Free plan: 1 contact included.',
        trial_setup_mode: 'Setting up',
    trial_setup_desc: 'Get everything ready — your trial starts when your first contact syncs.',
    trial_active_badge: '{days} days left',
    trial_active_badge_1: 'Last day',
    trial_started_title: 'Your trial has started.',
    existing_user_trial_title: '🎁 New premium features added.',
    existing_user_trial_desc: 'Enjoy full access free for the next 3 days — on us.',
    trial_started_desc: "3 days of full access. We'll show you when time is running low.",
    trial_expiring_title: 'Trial ends tomorrow',
    trial_expiring_desc: "After today you'll keep 1 contact active. The rest will be frozen — not deleted.",
    trial_expired_badge: 'Trial ended',
    trial_expired_title: 'Your trial has ended.',
    trial_expired_desc: "You're on the free plan. 1 contact stays active. The rest are frozen.",
    trial_locked_contact: 'Frozen — upgrade to reactivate',
    trial_active_contact: 'Active on free plan',
    trial_upgrade_to_unlock: 'Upgrade to unlock all {count} contacts',
    trial_upgrade_title: 'Unlock everything you built.',
    trial_upgrade_sub: '{count} contacts are frozen. Go Pro to reactivate all of them instantly.',
    trial_upgrade_cta: 'Reactivate all contacts',
    trial_days_remaining: '{days} days remaining',
    trial_hours_remaining: '{hours} hours remaining',
    trial_expires_today: 'Trial expires today',
    trial_label: 'Free trial',
    trial_full_access: 'Full access',
    trial_not_started: 'Trial not started',
        phone_registered_placeholder: 'Phone registered',
        settings_phone_label: 'Your WhatsApp Number',
    settings_phone_helper: 'Required for peer-to-peer photo sync. Stored as hash only.',
    settings_phone_label: 'Your WhatsApp Number',
    settings_phone_helper: 'Required for peer-to-peer photo sync. Stored as hash only.',
        settings_phone_label: 'Your WhatsApp Number',
    settings_phone_helper: 'Required for peer-to-peer photo sync. Stored as hash only.',
        refresh_prompt_waiting: 'Waiting...',
  },
  es: {
    lang_label: 'Idioma',
    headline: 'Ya cambias tu forma de hablar según quién te escucha.',
    headline_bridge: 'Tu foto no. Resulta que la gente lleva años pidiendo esto:',
    now_exists: 'Ahora existe.',
    sub: 'Asigna fotos diferentes a contactos distintos — tu jefe ve una, tus amigos ven otra. Cambiada automáticamente. Mismo número, mismo WhatsApp.',
    free_to_start: 'Gratis para empezar',
    works_on_web: 'Funciona en WhatsApp Web',
    two_minutes: '2 minutos de configuración',
    show_me: 'Muéstrame cómo',
    pair_title: 'DualProfile funciona entre dos personas.',
    pair_sub: 'Cuando asignas una foto a alguien, ellos también necesitan DualProfile. Envíales el enlace ahora, antes de terminar la configuración.',
    copy_link: '📎 Copiar enlace de instalación',
    copied_msg: 'Copiado — pégalo en WhatsApp y continúa',
    p2p_reminder_msg: '{name} vera esto una vez que tambien instale DualProfile.',
    continue_setup: 'Continuar configuración',
    invite_later: 'Lo invitaré más tarde',
    upload_title: 'Sube tus dos fotos.',
    upload_sub: 'Una para el trabajo. Una para todo lo demás.',
    phone_title: 'Ingresa tu número de WhatsApp.',
    phone_sub: 'Esto vincula tus fotos a tu identidad de WhatsApp.',
    refresh_title: 'Actualiza WhatsApp Web.',
    refresh_sub: 'Esto activa DualProfile dentro de WhatsApp.',
    assign_title: 'Asigna fotos a contactos.',
    assign_sub: 'Asigna Foto 1 o Foto 2 a cada contacto. Puedes cambiar esto en cualquier momento.',
    live_title: 'Estás en vivo.',
    live_sub: 'En el momento en que tu contacto instale y se registre, tu foto asignada aparecerá en su pantalla automáticamente.',
    open_wa: 'Abrir WhatsApp Web',
    copy_share: 'Copiar enlace para compartir',
    copy_share_confirm: 'Copiado — pégalo a tu contacto en WhatsApp',
    step_badge_1of3: 'Paso 1 de 3',
    upload_title2: 'Sube tus dos fotos',
    upload_sub2: 'Una para el trabajo. Una para la vida. Tú decides quién ve cuál.',
    upload_note: 'Solo necesitas una foto para continuar — añade la segunda más tarde.',
    upload_photo1_label: 'Foto 1',
    upload_photo2_label: 'Foto 2',
    upload_tap: 'Toca para subir',
    upload_hint1: 'p.ej. profesional, foto de trabajo',
    upload_hint2: 'p.ej. personal, casual, el verdadero tú',
    upload_error: 'Sube al menos una foto para continuar.',
    upload_too_large: 'Esa imagen es demasiado grande. Usa una de menos de 5MB.',
    upload_continue: 'Continuar',
    step_badge_2of3: 'Paso 2 de 3',
    phone_title2: 'Registra tu número de WhatsApp',
    phone_sub2: 'Así te reconocen otros usuarios de DualProfile y tu foto asignada llega a sus pantallas automáticamente.',
    phone_note: 'Incluye el código de país. Tu número nunca se almacena directamente — se convierte al instante en un código seguro.',
    phone_error: 'Introduce un número válido con el código de país.',
    phone_save: 'Guardar y continuar',
    phone_skip: 'Lo haré más tarde',
    phone_saving: 'Guardando...',
    phone_warn_title: 'Antes de omitir — esto es lo que perderás',
    phone_warn_li1: 'Otros usuarios de DualProfile no sabrán que tienes la extensión — verán un botón Invitar en lugar de tu perfil.',
    phone_warn_li2: 'Tus fotos asignadas no se sincronizarán en tiempo real.',
    phone_warn_li3: 'Sin tu número, DualProfile solo funciona a medias para ti.',
    phone_warn_register: 'Registrar mi número',
    phone_warn_skip: 'Omitir por ahora',
    refresh_title2: 'Actualiza tu pestaña de WhatsApp Web',
    refresh_sub2: 'Esto activa DualProfile dentro de WhatsApp y permite detectar tus contactos.',
    refresh_step1: 'Cambia a tu pestaña de WhatsApp Web',
    refresh_step2: 'Pulsa F5 o Ctrl + R · Mac: Cmd + R',
    refresh_step3: 'Vuelve aquí y toca Continuar',
    refresh_done: 'Listo — continuar',
    refresh_not_open: 'WhatsApp no está abierto ahora mismo',
    step_badge_3of3: 'Paso 3 de 3',
    assign_title2: '¿Quién ve qué foto?',
    assign_sub2: 'Asigna Foto 1 o Foto 2 a cada contacto. Puedes cambiarlo en cualquier momento desde la pestaña Contactos.',
    assign_scroll_title: 'Un momento antes de cargar tus contactos',
    assign_scroll_sub: 'Cambia a tu pestaña de WhatsApp Web y desplázate por tus chats — esto asegura que todos tus contactos estén cargados.',
    assign_load_btn: 'Listo — cargar mis contactos',
    assign_photo1_legend: 'Tu primera foto',
    assign_photo2_legend: 'Tu segunda foto',
    assign_loading: 'Cargando contactos de WhatsApp...',
    assign_no_contacts: 'No se encontraron contactos. Ve a WhatsApp Web, desplázate por tus chats y toca Reintentar.',
    assign_retry: 'Reintentar',
    assign_finish: 'Finalizar configuración',
    assign_skip: 'Asignaré contactos más tarde',
    assign_free_limit: 'Plan gratis: hasta',
    assign_free_contacts: 'contactos.',
    assign_upgrade: 'Mejorar a Pro →',
    live_badge_active: '● EN VIVO',
    live_badge_almost: '⚠ Casi listo',
    live_title_full: 'De ahora en adelante, cada persona ve exactamente lo que quieres que vea.',
    live_title_almost: 'Casi listo — queda un paso.',
    live_will_see_p1: 'Verá tu Foto 1 ✓',
    live_will_see_p2: 'Verá tu Foto 2 ✓',
    live_no_assign: 'Tus fotos están listas. Asigna contactos cuando quieras desde la pestaña Contactos.',
    live_check_photos: 'Fotos subidas',
    live_check_registered: 'En línea en la red DualProfile',
    live_check_not_registered: 'Número no registrado —',
    live_fix_this: 'corregir →',
    live_warn_detail: 'Sin tu número, los contactos ven un botón Invitar en lugar de tu foto y la sincronización en tiempo real no funciona.',
    live_fully_active: 'DualProfile completamente activo',
    live_partly_active: 'DualProfile parcialmente activo',
    live_nudge: '¿Necesitas más de 2 contactos?',
    live_upgrade: 'Mejorar a Pro →',
    live_network_title: 'Importante — cómo funciona DualProfile',
    live_network_body: 'Para que un contacto vea tu foto asignada, también necesita DualProfile instalado. Una vez que lo tenga, tu foto aparece en su pantalla automáticamente — sin pasos extra.',
    live_copy_link: 'Copiar enlace de instalación',
    live_copied: 'Copiado — pégalo a tu contacto en WhatsApp',
    live_continue: 'Continuar',
    tab_preview: 'Vista previa',
    tab_photos: 'Fotos',
    tab_contacts: 'Contactos',
    tab_settings: 'Ajustes',
    status_active: 'Extensión activa',
    status_disabled: 'Extensión desactivada',
    preview_hero_title: 'Simulación en vivo',
    preview_hero_sub: 'Ve exactamente cómo te ven distintas personas en WhatsApp',
    preview_label: 'Vista previa como:',
    preview_select: 'Selecciona un contacto...',
    preview_hint: 'Tu foto de perfil de WhatsApp se actualiza en vivo al cambiar de contacto',
    preview_exit_btn: 'Salir de la vista previa',
    preview_no_photo: 'Sube fotos primero, luego selecciona un contacto arriba',
    preview_go_photos: 'Subir fotos →',
    invite_choose_style: 'Elige tu estilo:',
    invite_copy_btn: 'Copiar mensaje',
    invite_wa_btn: 'Enviar por WhatsApp →',
    photo_click_upload: 'Haz clic para subir',
    photo1_label: 'Foto 1',
    photo2_label: 'Foto 2',
    photo_default_label: 'Foto predeterminada para contactos sin asignación:',
    photo_live_preview: 'Vista previa en vivo',
    photo_preview_desc: 'Ve cómo cambia tu foto de perfil en WhatsApp Web:',
    photo_preview_select: 'Seleccionar contacto...',
    photo_preview_as: 'Vista previa como:',
    exit_preview_mode: 'Salir del modo vista previa',
    contacts_loading: 'Cargando contactos de WhatsApp...',
    contacts_open_wa: 'Abre WhatsApp Web para ver los contactos',
    contacts_used: 'Plan gratis:',
    contacts_upgrade: 'Mejorar a Pro',
    quick_switch: '⇄ Cambio rápido',
    history_btn: '📋 Historial',
    select_contact: 'Seleccionar contacto...',
    register_now: 'Registrarse →',
    save_number: 'Guardar número',
    settings_appearance: 'Apariencia',
    settings_theme: 'Tema',
    settings_theme_desc: 'Elige tu esquema de colores preferido',
    settings_preview: 'Vista previa',
    settings_test: 'Prueba tu configuración',
    settings_test_desc: 'Previsualiza cómo verán tus fotos los contactos',
    settings_tutorial: 'Tutorial',
    settings_replay: 'Repetir incorporación',
    settings_replay_desc: 'Ver el tutorial de configuración de nuevo',
    settings_replay_btn: 'Repetir',
    settings_data: 'Datos',
    settings_clear: 'Borrar todos los datos',
    settings_preview_btn: 'Vista previa',
    copied_btn: '¡Copiado!',
    switching: '⇄ Cambiando…',
    switched: '✓ ¡Cambiado!',
    no_contacts_wa: 'No se encontraron contactos. Asegúrate de que WhatsApp Web esté cargado.',
    contacts_load_err: 'No se pudieron cargar los contactos. Intenta actualizar WhatsApp Web.',
    activating_preview: 'Activando vista previa...',
    open_wa_first: 'Abre WhatsApp Web primero para usar la vista previa.',
    preview_failed: 'Vista previa fallida.',
    no_wa_connect: 'No se pudo conectar a WhatsApp Web.',
    confirm_clear: '¿Borrar todos los datos? Esto no se puede deshacer.',
    number_mismatch: 'Tu número registrado no coincide con la cuenta de WhatsApp abierta actualmente.',
    update_number: 'Actualizar número',
    how_to_refresh: 'Cómo actualizar',
    refresh_instructions: 'Pulsa F5 (o Cmd+R en Mac) en tu pestaña de WhatsApp Web, luego reabre este popup.',
    waiting_refresh: 'Esperando actualización…',
    wa_active: '✓ Activo',
    wa_open_first: 'Abre WhatsApp Web primero',
    reddit_meta1: 'r/whatsapp · hace 9 años',
    reddit_q1: '"¿Hay alguna forma de mostrar fotos de perfil diferentes a personas distintas?"',
    reddit_a1: 'Respuesta principal: No.',
    reddit_meta2: 'r/whatsapp · hace 5 años',
    reddit_q2: '"Foto de perfil diferente entre web y app, ¿es posible?"',
    reddit_a2: 'Respuesta principal: Solo si tienes dos números.',
    reddit_meta3: 'r/whatsapp · hace 8 meses',
    reddit_q3: '"WhatsApp debería admitir varias fotos de perfil."',
    reddit_a3: 'Respuesta principal: [eliminado]',
    tagline: 'Fotos diferentes para personas diferentes',
    help_btn: 'Ayuda',
    upgrade_title: 'Mejora a DualProfile Pro',
    upgrade_limit_msg: 'Has alcanzado el límite gratuito (2 contactos).',
    upgrade_monthly: 'Mensual — £9.99/mes',
    upgrade_annual: 'Anual — £59/año',
    tag_annual: 'Anual',
    tag_lifetime: 'Lifetime',
    upgrade_lifetime: 'De por vida — £79 una vez',
    upgrade_payment_note: 'Pago seguro mediante Lemon Squeezy.',
    upgrade_license_label: '¿Ya compraste? Ingresa tu clave de licencia:',
    upgrade_activate: 'Activar',
    upgrade_validating: 'Validando licencia...',
    upgrade_license_err: 'Por favor ingresa tu clave de licencia',
    upgrade_close: 'Cerrar',
    upgrade_coming_soon_badge: '🚀 ¡Próximamente!',
    upgrade_coming_soon_msg: 'Las funciones Pro estarán disponibles después del lanzamiento en Chrome Web Store.',
    upgrade_email_placeholder: 'Ingresa tu email para acceso anticipado',
    upgrade_notify_btn: 'Notifícame',
    upgrade_signup_note: '¡Sé el primero en saber cuándo se lanza Pro!',
    upgrade_on_list: '¡Estás en la lista!',
    upgrade_already_on_list: '¡Ya estás en la lista!',
    upgrade_email_confirm: 'Te enviaremos un email a:',
    upgrade_launch_note: 'cuando se lancen las funciones Pro.',
    upgrade_notify_note: 'Te avisaremos cuando se lance Pro.',
    lets_go: 'Vamos',
    pro_features_title: 'Planes y funciones',
    pro_unlimited_title: 'Contactos ilimitados',
    pro_unlimited_desc: 'Asigna a tantos contactos como quieras',
    pro_quickswitch_title: 'Cambio rápido',
    pro_quickswitch_desc: 'Cambia todos P1 ⇄ P2 de un toque',
    pro_history_title: 'Historial de asignaciones',
    pro_history_desc: 'Registro completo de cada cambio',
    pro_support_title: 'Soporte prioritario',
    pro_support_desc: 'Acceso directo al equipo por email',
    pro_workmode_title: 'Modo trabajo / personal',
    pro_workmode_desc: 'Próximamente',
    pro_photohistory_title: 'Historial de fotos y reversión',
    pro_photohistory_desc: 'Restaura cualquiera de tus últimas 3 fotos',
    feat_bulk_title: 'Asignación masiva de contactos',
    pro_schedule_title: 'Fotos programadas',
    pro_schedule_desc: 'Cambia fotos automáticamente por día y hora',
    pro_export_title: 'Exportar e importar asignaciones',
    pro_export_desc: 'Haz copia de seguridad y restaura tus asignaciones',
    pro_multidevice_title: 'Sincronización multidispositivo',
    pro_multidevice_desc: 'Tus preferencias se sincronizan en todos tus dispositivos',
    history_panel_title: 'Historial de fotos',
    history_slot1: 'Historial foto 1',
    history_slot2: 'Historial foto 2',
    history_restore_btn: 'Restaurar',
    history_empty: 'Sin historial aún — las fotos anteriores aparecerán aquí',
    history_restored_toast: 'Foto restaurada correctamente',
    history_pro_gate: 'El historial de fotos es una función Pro',
    schedule_panel_title: 'Fotos programadas',
    schedule_enable_label: 'Activar horario',
    schedule_photo_label: 'Foto activa durante el horario',
    schedule_days_label: 'Días activos',
    schedule_start_label: 'Hora de inicio',
    schedule_end_label: 'Hora de fin',
    schedule_save_btn: 'Guardar horario',
    schedule_saved_toast: 'Horario guardado',
    schedule_pro_gate: 'Las fotos programadas son una función Anual',
    schedule_day_sun: 'Dom', schedule_day_mon: 'Lun', schedule_day_tue: 'Mar',
    schedule_day_wed: 'Mié', schedule_day_thu: 'Jue', schedule_day_fri: 'Vie', schedule_day_sat: 'Sáb',
    schedule_active_badge: 'Horario activo',
    export_btn: 'Exportar asignaciones',
    import_btn: 'Importar asignaciones',
    export_success_toast: 'Asignaciones exportadas',
    import_success_toast: 'Asignaciones importadas correctamente',
    import_error_toast: 'Archivo no válido — no se pudo importar',
    export_pro_gate: 'Exportar e importar es una función Lifetime',
    unlock_pro: 'Ver planes — desde £9.99/mes',
    unlock_annual: 'Desbloquear Anual — £59/año · Asignación masiva',
    bulk_mode_label: 'Selección masiva',
    bulk_assigned_p1: 'Asignado a Foto 1',
    bulk_assigned_p2: 'Asignado a Foto 2',
    bulk_teaser: 'Selecciona todos tus contactos de trabajo a la vez. Plan anual.',
    coming_soon: 'Próximamente',
    history_contacts_flipped: 'contactos cambiados',
    history_removed: 'eliminado',
    help_title: 'Cómo usar DualProfile',
    help_li1: 'Sube 2 fotos de perfil diferentes',
    help_li2: 'Ve a la pestaña Contactos y asigna contactos a cada foto',
    help_li3: 'Los contactos de Foto 1 verán la Foto 1',
    help_li4: 'Los contactos de Foto 2 verán la Foto 2',
    help_li5: '¡Usa Vista previa en vivo para probar!',
    help_free_title: 'Plan gratuito',
    help_free_desc: 'Puedes asignar hasta 2 contactos gratis. Mejora a Pro para contactos ilimitados.',
    help_trouble_title: 'Solución de problemas',
    help_trouble_desc: 'Si los contactos no cargan, asegúrate de que WhatsApp Web esté abierto. Intenta desplazarte por la lista de chats primero.',
    preview_setup_title: 'Vista previa de tu configuración',
    preview_setup_desc: 'Así verán tus fotos tus contactos:',
    preview_no_photo_label: 'Sin foto',
    preview_close: 'Cerrar',
    waiting_for_install: 'Esperando que',
    to_install: 'instale…',
    p2p_sync_active: 'Sincronización P2P activa',
    sync_inactive: 'Inactivo',
    sync_not_configured: 'No configurado — ajusta Convex/Cloudinary en config.js',
    enter_phone_for_sync: 'Ingresa tu número para habilitar la sincronización P2P',
    number_saved: '✓ ¡Número guardado! La sincronización P2P está activa.',
    change: 'Cambiar',
    wa_is_active: 'DualProfile está activo',
    sync_is_live: 'La sincronización está activa. Ya puedes asignar fotos.',
    no_photo_assignment: 'Sin foto subida para esta asignación.',
    no_history_found: 'No se encontró historial.',
    one_more_step: 'Un paso más',
    hard_refresh_msg: 'Recarga WhatsApp Web ahora para activar DualProfile. Pulsa Ctrl+Shift+R (Mac: Cmd+Shift+R) en tu pestaña de WhatsApp.',
    upgrade_working_title: 'Te pueden ver. 🎉',
    upgrade_working_sub: 'Tu primer contacto asignado ahora ve exactamente la foto que elegiste para él. ¿Quieres que todos tus contactos vean la versión correcta de ti?',
    upgrade_working_cta: 'Desbloquear todos los contactos',
    upgrade_limit_msg_1: 'Plan gratuito: 1 contacto incluido.',
        trial_setup_mode: 'Configurando',
    trial_setup_desc: 'Prepara todo — tu prueba comienza cuando tu primer contacto se sincronice.',
    trial_active_badge: '{days} días restantes',
    trial_active_badge_1: 'Último día',
    trial_started_title: 'Tu prueba ha comenzado.',
    existing_user_trial_title: '🎁 Nuevas funciones premium añadidas.',
    existing_user_trial_desc: 'Disfruta acceso completo gratis durante 3 días.',
    trial_started_desc: '3 días de acceso completo. Te avisaremos cuando el tiempo esté por terminar.',
    trial_expiring_title: 'La prueba termina mañana',
    trial_expiring_desc: 'Después de hoy mantendrás 1 contacto activo. El resto se congelará, no se eliminará.',
    trial_expired_badge: 'Prueba finalizada',
    trial_expired_title: 'Tu prueba ha terminado.',
    trial_expired_desc: 'Estás en el plan gratuito. 1 contacto sigue activo. El resto está congelado.',
    trial_locked_contact: 'Congelado — actualiza para reactivar',
    trial_active_contact: 'Activo en plan gratuito',
    trial_upgrade_to_unlock: 'Actualiza para desbloquear los {count} contactos',
    trial_upgrade_title: 'Desbloquea todo lo que construiste.',
    trial_upgrade_sub: '{count} contactos están congelados. Pasa a Pro para reactivarlos todos al instante.',
    trial_upgrade_cta: 'Reactivar todos los contactos',
    trial_days_remaining: '{days} días restantes',
    trial_hours_remaining: '{hours} horas restantes',
    trial_expires_today: 'La prueba expira hoy',
    trial_label: 'Prueba gratuita',
    trial_full_access: 'Acceso completo',
    trial_not_started: 'Prueba no iniciada',
        phone_registered_placeholder: 'Teléfono registrado',
        settings_phone_label: 'Tu número de WhatsApp',
    settings_phone_helper: 'Necesario para sincronización foto P2P. Solo se guarda como hash.',
    settings_phone_label: 'Tu número de WhatsApp',
    settings_phone_helper: 'Necesario para sincronización foto P2P. Solo se guarda como hash.',
        settings_phone_label: 'Tu número de WhatsApp',
    settings_phone_helper: 'Necesario para sincronización foto P2P. Solo se guarda como hash.',
        refresh_prompt_waiting: 'Esperando...',
  },
  zh: {
    lang_label: '语言',
    headline: '你和不同的人说话方式本来就不一样。',
    headline_bridge: '你的照片却没有。原来大家已经要求这个功能很多年了：',
    now_exists: '现在它存在了。',
    sub: '为不同联系人分配不同的头像——老板看到一张，朋友看到另一张。自动切换。同一个号码，同一个WhatsApp。',
    free_to_start: '免费开始',
    works_on_web: '适用于WhatsApp Web',
    two_minutes: '2分钟设置',
    show_me: '告诉我怎么做',
    pair_title: 'DualProfile在两人之间使用。',
    pair_sub: '当你为某人分配照片时，他们也需要安装DualProfile。现在发送链接给他们，在完成设置之前。',
    copy_link: '📎 复制安装链接',
    copied_msg: '已复制 — 粘贴到WhatsApp并继续',
    p2p_reminder_msg: '{name} 安装DualProfile后才能看到这张照片。',
    continue_setup: '继续设置',
    invite_later: '稍后邀请',
    upload_title: '上传你的两张照片。',
    upload_sub: '一张用于工作，一张用于其他。',
    phone_title: '输入你的WhatsApp号码。',
    phone_sub: '这将你的照片与你的WhatsApp身份关联。',
    refresh_title: '刷新WhatsApp Web。',
    refresh_sub: '这将在WhatsApp中激活DualProfile。',
    assign_title: '为联系人分配照片。',
    assign_sub: '为每个联系人分配照片1或照片2。',
    live_title: '你已上线。',
    live_sub: '一旦你的联系人安装并注册，你分配的照片将自动出现在他们的屏幕上。',
    open_wa: '打开WhatsApp Web',
    copy_share: '复制安装链接分享',
    copy_share_confirm: '已复制 — 粘贴给你的联系人',
    step_badge_1of3: '第1步，共3步',
    upload_title2: '上传你的两张照片',
    upload_sub2: '一张用于工作，一张用于生活。由你决定谁看哪张。',
    upload_note: '只需一张照片即可继续 — 第二张可以稍后添加。',
    upload_photo1_label: '照片1',
    upload_photo2_label: '照片2',
    upload_tap: '点击上传',
    upload_hint1: '如：专业、工作照',
    upload_hint2: '如：个人、休闲、真实的你',
    upload_error: '请至少上传一张照片才能继续。',
    upload_too_large: '图片太大，请使用5MB以下的图片。',
    upload_continue: '继续',
    step_badge_2of3: '第2步，共3步',
    phone_title2: '注册你的WhatsApp号码',
    phone_sub2: '这是其他DualProfile用户识别你的方式，也是你的指定照片自动出现在他们屏幕上的方式。',
    phone_note: '请包含国家代码。你的号码不会直接存储 — 会立即转换为私密安全代码。',
    phone_error: '请输入包含国家代码的有效号码。',
    phone_save: '保存并继续',
    phone_skip: '稍后再做',
    phone_saving: '保存中...',
    phone_warn_title: '跳过之前 — 你将失去以下功能',
    phone_warn_li1: '其他DualProfile用户不会知道你安装了此扩展 — 他们会看到邀请按钮而非你的资料。',
    phone_warn_li2: '你的指定照片不会实时同步到联系人。',
    phone_warn_li3: '没有号码，DualProfile对你来说只有一半功能。',
    phone_warn_register: '注册我的号码',
    phone_warn_skip: '暂时跳过',
    refresh_title2: '刷新WhatsApp Web标签页',
    refresh_sub2: '这将在WhatsApp中激活DualProfile并检测你的联系人。',
    refresh_step1: '切换到你的WhatsApp Web标签页',
    refresh_step2: '按F5或Ctrl+R · Mac：Cmd+R',
    refresh_step3: '回到这里点击继续',
    refresh_done: '完成 — 继续',
    refresh_not_open: 'WhatsApp现在未打开',
    step_badge_3of3: '第3步，共3步',
    assign_title2: '谁看哪张照片？',
    assign_sub2: '为每个联系人分配照片1或照片2，可随时在联系人标签页中更改。',
    assign_scroll_title: '加载联系人前请注意',
    assign_scroll_sub: '切换到WhatsApp Web标签页并向下滚动聊天列表 — 确保所有联系人都已加载。',
    assign_load_btn: '完成 — 加载我的联系人',
    assign_photo1_legend: '你的第一张照片',
    assign_photo2_legend: '你的第二张照片',
    assign_loading: '正在从WhatsApp加载联系人...',
    assign_no_contacts: '未找到联系人。请前往WhatsApp Web滚动聊天后点击重试。',
    assign_retry: '重试',
    assign_finish: '完成设置',
    assign_skip: '稍后分配联系人',
    assign_free_limit: '免费计划：最多',
    assign_free_contacts: '个联系人。',
    assign_upgrade: '升级到专业版 →',
    live_badge_active: '● 已上线',
    live_badge_almost: '⚠ 即将完成',
    live_title_full: '从现在起，每个人都看到你想让他们看到的。',
    live_title_almost: '即将完成 — 还差一步。',
    live_will_see_p1: '将看到你的照片1 ✓',
    live_will_see_p2: '将看到你的照片2 ✓',
    live_no_assign: '你的照片已就绪。可随时在联系人标签页中分配联系人。',
    live_check_photos: '照片已上传',
    live_check_registered: '已加入 DualProfile 网络',
    live_check_not_registered: '号码未注册 —',
    live_fix_this: '立即修复 →',
    live_warn_detail: '没有号码，联系人会看到邀请按钮而不是你的照片，实时同步也无法工作。',
    live_fully_active: 'DualProfile完全激活',
    live_partly_active: 'DualProfile部分激活',
    live_nudge: '需要超过2个联系人？',
    live_upgrade: '升级到专业版 →',
    live_network_title: '重要 — DualProfile的工作原理',
    live_network_body: '要让联系人看到你的指定照片，他们也需要安装DualProfile。一旦安装，你的照片会自动出现在他们的屏幕上 — 无需额外步骤。',
    live_copy_link: '复制安装链接分享',
    live_copied: '已复制 — 粘贴给你的联系人',
    live_continue: '继续',
    tab_preview: '预览',
    tab_photos: '照片',
    tab_contacts: '联系人',
    tab_settings: '设置',
    status_active: '扩展已激活',
    status_disabled: '扩展已禁用',
    preview_hero_title: '实时模拟',
    preview_hero_sub: '查看不同联系人在WhatsApp上看到的你的样子',
    preview_label: '预览为:',
    preview_select: '选择联系人...',
    preview_hint: '切换联系人时你的WhatsApp头像实时更新',
    preview_exit_btn: '退出预览',
    preview_no_photo: '请先上传照片，然后在上方选择联系人',
    preview_go_photos: '上传照片 →',
    invite_choose_style: '选择你的风格:',
    invite_copy_btn: '复制消息',
    invite_wa_btn: '通过WhatsApp发送 →',
    photo_click_upload: '点击上传',
    photo1_label: '照片1',
    photo2_label: '照片2',
    photo_default_label: '未列出联系人的默认照片:',
    photo_live_preview: '实时预览',
    photo_preview_desc: '查看你的头像在WhatsApp Web中实时变化:',
    photo_preview_select: '选择联系人...',
    photo_preview_as: '预览为:',
    exit_preview_mode: '退出预览模式',
    contacts_loading: '正在从WhatsApp加载联系人...',
    contacts_open_wa: '打开WhatsApp Web查看联系人',
    contacts_used: '免费计划:',
    contacts_upgrade: '升级到专业版',
    quick_switch: '⇄ 快速切换',
    history_btn: '📋 历史',
    select_contact: '选择联系人...',
    register_now: '立即注册 →',
    save_number: '保存号码',
    settings_appearance: '外观',
    settings_theme: '主题',
    settings_theme_desc: '选择你喜欢的颜色方案',
    settings_preview: '预览',
    settings_test: '测试你的设置',
    settings_test_desc: '预览联系人将如何看到你的照片',
    settings_tutorial: '教程',
    settings_replay: '重播引导',
    settings_replay_desc: '再次观看设置教程',
    settings_replay_btn: '重播',
    settings_data: '数据',
    settings_clear: '清除所有数据',
    settings_preview_btn: '预览',
    copied_btn: '已复制！',
    switching: '⇄ 切换中…',
    switched: '✓ 已切换！',
    no_contacts_wa: '未找到联系人。请确保WhatsApp Web已加载。',
    contacts_load_err: '无法加载联系人。请尝试刷新WhatsApp Web。',
    activating_preview: '正在激活预览...',
    open_wa_first: '请先打开WhatsApp Web以使用预览。',
    preview_failed: '预览失败。',
    no_wa_connect: '无法连接到WhatsApp Web。',
    confirm_clear: '清除所有数据？此操作无法撤销。',
    number_mismatch: '你的注册号码与当前打开的WhatsApp账号不符。',
    update_number: '更新号码',
    how_to_refresh: '如何刷新',
    refresh_instructions: '在你的WhatsApp Web标签页上按F5（Mac：Cmd+R），然后重新打开此弹窗。',
    waiting_refresh: '等待刷新…',
    wa_active: '✓ 已激活',
    wa_open_first: '请先打开WhatsApp Web',
    reddit_meta1: 'r/whatsapp · 9年前',
    reddit_q1: '"有没有办法向不同的人显示不同的头像？"',
    reddit_a1: '最高票回答：不行。',
    reddit_meta2: 'r/whatsapp · 5年前',
    reddit_q2: '"网页版和手机版可以显示不同头像吗？"',
    reddit_a2: '最高票回答：只有两个号码才行。',
    reddit_meta3: 'r/whatsapp · 8个月前',
    reddit_q3: '"WhatsApp应该支持多张头像。"',
    reddit_a3: '最高票回答：[已删除]',
    tagline: '为不同的人展示不同的照片',
    help_btn: '帮助',
    upgrade_title: '升级到DualProfile Pro',
    upgrade_limit_msg: '您已达到免费限制（2个联系人）。',
    upgrade_monthly: '月付 — £9.99/月',
    upgrade_annual: '年度 — £59/年',
    tag_annual: '年度',
    tag_lifetime: 'Lifetime',
    upgrade_lifetime: '终身 — £79一次性',
    upgrade_payment_note: '通过Lemon Squeezy安全付款。',
    upgrade_license_label: '已购买？输入您的许可证密钥：',
    upgrade_activate: '激活',
    upgrade_validating: '正在验证许可证...',
    upgrade_license_err: '请输入您的许可证密钥',
    upgrade_close: '关闭',
    upgrade_coming_soon_badge: '🚀 即将推出！',
    upgrade_coming_soon_msg: 'Pro功能将在Chrome Web Store上线后推出。',
    upgrade_email_placeholder: '输入邮箱以获取早期访问',
    upgrade_notify_btn: '通知我',
    upgrade_signup_note: '率先了解Pro发布消息！',
    upgrade_on_list: '您已加入列表！',
    upgrade_already_on_list: '您已经在列表中了！',
    upgrade_email_confirm: '我们将发送邮件至：',
    upgrade_launch_note: '当Pro功能发布时。',
    upgrade_notify_note: '当Pro发布时我们会通知您。',
    lets_go: '出发',
    pro_features_title: '套餐与功能',
    pro_unlimited_title: '无限联系人',
    pro_unlimited_desc: '可分配任意数量的联系人',
    pro_quickswitch_title: '快速切换',
    pro_quickswitch_desc: '一键翻转所有P1 ⇄ P2',
    pro_history_title: '分配历史',
    pro_history_desc: '每次更改的完整日志',
    pro_support_title: '优先支持',
    pro_support_desc: '直接邮件联系团队',
    pro_workmode_title: '工作/个人模式',
    pro_workmode_desc: '即将推出',
    pro_photohistory_title: '照片历史与还原',
    pro_photohistory_desc: '恢复最近上传的3张照片之一',
    feat_bulk_title: '批量联系人分配',
    pro_schedule_title: '定时照片',
    pro_schedule_desc: '按日期和时间自动切换照片',
    pro_export_title: '导出和导入联系人分配',
    pro_export_desc: '备份和恢复所有联系人分配',
    pro_multidevice_title: '多设备同步',
    pro_multidevice_desc: '您的偏好设置在所有设备间同步',
    history_panel_title: '照片历史',
    history_slot1: '照片1历史', history_slot2: '照片2历史',
    history_restore_btn: '恢复',
    history_empty: '暂无历史记录 — 之前的照片将显示在这里',
    history_restored_toast: '照片恢复成功',
    history_pro_gate: '照片历史是专业功能',
    schedule_panel_title: '定时照片',
    schedule_enable_label: '启用日程', schedule_photo_label: '窗口期间活跃照片',
    schedule_days_label: '活跃日期', schedule_start_label: '开始时间', schedule_end_label: '结束时间',
    schedule_save_btn: '保存日程', schedule_saved_toast: '日程已保存',
    schedule_pro_gate: '定时照片是年度功能',
    schedule_day_sun: '日', schedule_day_mon: '一', schedule_day_tue: '二',
    schedule_day_wed: '三', schedule_day_thu: '四', schedule_day_fri: '五', schedule_day_sat: '六',
    schedule_active_badge: '日程激活',
    export_btn: '导出分配', import_btn: '导入分配',
    export_success_toast: '分配已导出', import_success_toast: '分配导入成功',
    import_error_toast: '无效文件 — 无法导入', export_pro_gate: '导出和导入是Lifetime功能',
    unlock_pro: '查看套餐 — 低至£9.99/月',
    unlock_annual: '解锁年度计划 — £59/年 · 批量分配',
    bulk_mode_label: '批量选择',
    bulk_assigned_p1: '已分配到照片1',
    bulk_assigned_p2: '已分配到照片2',
    bulk_teaser: '一次选择所有工作联系人。年度计划。',
    coming_soon: '即将推出',
    history_contacts_flipped: '个联系人已翻转',
    history_removed: '已移除',
    help_title: '如何使用DualProfile',
    help_li1: '上传2张不同的头像',
    help_li2: '进入联系人标签为每张照片分配联系人',
    help_li3: '分配给照片1的联系人将看到照片1',
    help_li4: '分配给照片2的联系人将看到照片2',
    help_li5: '使用实时预览测试效果！',
    help_free_title: '免费计划',
    help_free_desc: '免费可分配最多2个联系人。升级到Pro即可无限分配。',
    help_trouble_title: '故障排除',
    help_trouble_desc: '如果联系人未加载，请确保WhatsApp Web已打开并完全加载。先尝试滚动聊天列表。',
    preview_setup_title: '预览您的设置',
    preview_setup_desc: '您的联系人将如此看到您的照片：',
    preview_no_photo_label: '无照片',
    preview_close: '关闭',
    waiting_for_install: '等待',
    to_install: '安装…',
    p2p_sync_active: 'P2P同步已激活',
    sync_inactive: '未激活',
    sync_not_configured: '未配置 — 请在config.js中设置Convex/Cloudinary',
    enter_phone_for_sync: '输入手机号以启用P2P同步',
    number_saved: '✓ 号码已保存！P2P同步现已激活。',
    change: '更改',
    wa_is_active: 'DualProfile已激活',
    sync_is_live: '同步已上线，您现在可以为联系人分配照片。',
    no_photo_assignment: '此分配没有上传照片。',
    no_history_found: '未找到历史记录。',
    one_more_step: '还差一步',
    hard_refresh_msg: '现在请硬刷新WhatsApp Web以激活DualProfile。在WhatsApp标签页按Ctrl+Shift+R（Mac：Cmd+Shift+R）。',
    upgrade_working_title: '他们能看到你了。🎉',
    upgrade_working_sub: '你的第一个指定联系人现在看到了你为他们选择的照片。想让所有联系人都看到正确的你吗？',
    upgrade_working_cta: '解锁所有联系人',
    upgrade_limit_msg_1: '免费计划：包含1个联系人。',
        trial_setup_mode: '设置中',
    trial_setup_desc: '完成设置 — 当您的第一个联系人同步成功后，试用期开始计时。',
    trial_active_badge: '还剩{days}天',
    trial_active_badge_1: '最后一天',
    trial_started_title: '您的试用期已开始。',
    existing_user_trial_title: '🎁 新增高级功能。',
    existing_user_trial_desc: '免费享受3天完整访问权限。',
    trial_started_desc: '3天完整使用权限。时间快到时我们会提醒您。',
    trial_expiring_title: '试用期明天结束',
    trial_expiring_desc: '明天之后，1个联系人保持活跃，其余将被冻结——不会被删除。',
    trial_expired_badge: '试用已结束',
    trial_expired_title: '您的试用期已结束。',
    trial_expired_desc: '您正在使用免费计划。1个联系人保持活跃，其余已被冻结。',
    trial_locked_contact: '已冻结 — 升级以重新激活',
    trial_active_contact: '在免费计划中活跃',
    trial_upgrade_to_unlock: '升级以解锁全部{count}个联系人',
    trial_upgrade_title: '解锁您创建的所有内容。',
    trial_upgrade_sub: '{count}个联系人已被冻结。升级到Pro，立即重新激活所有联系人。',
    trial_upgrade_cta: '重新激活所有联系人',
    trial_days_remaining: '还剩{days}天',
    trial_hours_remaining: '还剩{hours}小时',
    trial_expires_today: '试用期今天到期',
    trial_label: '免费试用',
    trial_full_access: '完整访问',
    trial_not_started: '试用未开始',
        phone_registered_placeholder: '手机号已注册',
        settings_phone_label: '您的WhatsApp号码',
    settings_phone_helper: 'P2P照片同步所需，仅存储为哈希值。',
    settings_phone_label: '您的WhatsApp号码',
    settings_phone_helper: 'P2P照片同步所需，仅存储为哈希值。',
        settings_phone_label: '您的WhatsApp号码',
    settings_phone_helper: 'P2P照片同步所需，仅存储为哈希值。',
        refresh_prompt_waiting: '等待中...',
  },
  ja: {
    lang_label: '言語',
    headline: '話す相手によって話し方はすでに変えているはず。',
    headline_bridge: 'でも写真は変わっていません。実は何年も前から求められていました：',
    now_exists: 'ついに実現しました。',
    sub: '連絡先ごとに異なるプロフィール写真を割り当て — 上司には1枚、友達には別の1枚。自動で切り替わります。同じ番号、同じWhatsApp。',
    free_to_start: '無料で始める',
    works_on_web: 'WhatsApp Webで動作',
    two_minutes: '設定2分',
    show_me: '使い方を見る',
    pair_title: 'DualProfileは2人で使います。',
    pair_sub: '連絡先に写真を割り当てると、相手もDualProfileが必要です。設定を終える前に、今すぐリンクを送ってください。',
    copy_link: '📎 インストールリンクをコピー',
    copied_msg: 'コピーしました — WhatsAppに貼り付けて続けてください',
    p2p_reminder_msg: '{name}がDualProfileをインストールすると、この写真が表示されます。',
    continue_setup: 'セットアップを続ける',
    invite_later: '後で招待する',
    upload_title: '2枚の写真をアップロードしてください。',
    upload_sub: '1枚は仕事用、もう1枚はプライベート用。',
    phone_title: 'WhatsAppの番号を入力してください。',
    phone_sub: '写真をWhatsAppのIDに紐付けます。',
    refresh_title: 'WhatsApp Webを更新してください。',
    refresh_sub: 'WhatsApp内でDualProfileを有効にします。',
    assign_title: '連絡先に写真を割り当てる。',
    assign_sub: '各連絡先に写真1または写真2を割り当てます。',
    live_title: '準備完了です。',
    live_sub: '連絡先がインストールして登録した瞬間、割り当てた写真が自動的に表示されます。',
    open_wa: 'WhatsApp Webを開く',
    copy_share: 'インストールリンクをコピー',
    copy_share_confirm: 'コピーしました — 連絡先に貼り付けてください',
    step_badge_1of3: 'ステップ1/3',
    upload_title2: '2枚の写真をアップロード',
    upload_sub2: '1枚は仕事用、1枚はプライベート用。誰に何を見せるかはあなたが決めます。',
    upload_note: '1枚だけでも続けられます — 2枚目は後で追加できます。',
    upload_photo1_label: '写真1',
    upload_photo2_label: '写真2',
    upload_tap: 'タップしてアップロード',
    upload_hint1: '例：プロ、仕事用の写真',
    upload_hint2: '例：プライベート、カジュアル、素の自分',
    upload_error: '続けるには少なくとも1枚の写真が必要です。',
    upload_too_large: '画像が大きすぎます。5MB以下の画像を使用してください。',
    upload_continue: '続ける',
    step_badge_2of3: 'ステップ2/3',
    phone_title2: 'WhatsApp番号を登録',
    phone_sub2: 'これにより他のDualProfileユーザーにあなたを認識させ、割り当てた写真が自動的に画面に表示されます。',
    phone_note: '国番号を含めてください。番号は直接保存されず、即座にプライベートなセキュアコードに変換されます。',
    phone_error: '国番号を含む有効な番号を入力してください。',
    phone_save: '保存して続ける',
    phone_skip: '後でやる',
    phone_saving: '保存中...',
    phone_warn_title: 'スキップ前に — 失うものを確認してください',
    phone_warn_li1: '他のDualProfileユーザーはあなたが拡張機能を使っていることがわからず、プロフィールの代わりに招待ボタンが表示されます。',
    phone_warn_li2: '割り当てた写真がリアルタイムで同期されません。',
    phone_warn_li3: '番号なしではDualProfileは半分しか機能しません。',
    phone_warn_register: '番号を登録する',
    phone_warn_skip: '今はスキップ',
    refresh_title2: 'WhatsApp Webタブを更新',
    refresh_sub2: 'これによりWhatsApp内でDualProfileが有効化され、連絡先を検出できるようになります。',
    refresh_step1: 'WhatsApp Webタブに切り替える',
    refresh_step2: 'F5またはCtrl+Rを押す · Mac：Cmd+R',
    refresh_step3: 'ここに戻って「続ける」をタップ',
    refresh_done: '完了 — 続ける',
    refresh_not_open: 'WhatsAppは今開いていません',
    step_badge_3of3: 'ステップ3/3',
    assign_title2: '誰にどの写真を見せますか？',
    assign_sub2: '各連絡先に写真1または写真2を割り当てます。連絡先タブからいつでも変更できます。',
    assign_scroll_title: '連絡先を読み込む前に',
    assign_scroll_sub: 'WhatsApp Webタブに切り替えてチャット一覧を下にスクロール — すべての連絡先が読み込まれます。',
    assign_load_btn: '完了 — 連絡先を読み込む',
    assign_photo1_legend: '最初の写真',
    assign_photo2_legend: '2枚目の写真',
    assign_loading: 'WhatsAppから連絡先を読み込み中...',
    assign_no_contacts: '連絡先が見つかりません。WhatsApp Webでチャットをスクロールしてから再試行してください。',
    assign_retry: '再試行',
    assign_finish: 'セットアップ完了',
    assign_skip: '後で連絡先を割り当てる',
    assign_free_limit: '無料プラン：最大',
    assign_free_contacts: '件の連絡先。',
    assign_upgrade: 'Proにアップグレード →',
    live_badge_active: '● ライブ中',
    live_badge_almost: '⚠ もう少し',
    live_title_full: 'これから、誰もがあなたが見せたい姿を見るようになります。',
    live_title_almost: 'もう少し — あと1ステップです。',
    live_will_see_p1: '写真1が表示されます ✓',
    live_will_see_p2: '写真2が表示されます ✓',
    live_no_assign: '写真は準備完了。連絡先タブからいつでも割り当てできます。',
    live_check_photos: '写真アップロード済み',
    live_check_registered: 'DualProfileネットワークに参加しました',
    live_check_not_registered: '番号未登録 —',
    live_fix_this: '修正する →',
    live_warn_detail: '番号がないと、連絡先にはあなたの写真の代わりに招待ボタンが表示され、リアルタイム同期も機能しません。',
    live_fully_active: 'DualProfile完全有効',
    live_partly_active: 'DualProfile部分的に有効',
    live_nudge: '2件以上の連絡先が必要ですか？',
    live_upgrade: 'Proにアップグレード →',
    live_network_title: '重要 — DualProfileの仕組み',
    live_network_body: '連絡先があなたの割り当て写真を見るには、相手もDualProfileをインストールする必要があります。インストールすれば、写真は自動的に表示されます — 追加の手順は不要です。',
    live_copy_link: 'インストールリンクをコピー',
    live_copied: 'コピーしました — 連絡先に貼り付けてください',
    live_continue: '続ける',
    tab_preview: 'プレビュー',
    tab_photos: '写真',
    tab_contacts: '連絡先',
    tab_settings: '設定',
    status_active: '拡張機能有効',
    status_disabled: '拡張機能無効',
    preview_hero_title: 'ライブシミュレーション',
    preview_hero_sub: 'WhatsAppで様々な人にどう見えるか確認できます',
    preview_label: 'プレビュー対象:',
    preview_select: '連絡先を選択...',
    preview_hint: '連絡先を切り替えるとWhatsAppのプロフィール写真がリアルタイムで更新されます',
    preview_exit_btn: 'プレビューを終了',
    preview_no_photo: '先に写真をアップロードして、上から連絡先を選択してください',
    preview_go_photos: '写真をアップロード →',
    invite_choose_style: 'スタイルを選択:',
    invite_copy_btn: 'メッセージをコピー',
    invite_wa_btn: 'WhatsAppで送信 →',
    photo_click_upload: 'クリックしてアップロード',
    photo1_label: '写真1',
    photo2_label: '写真2',
    photo_default_label: '未設定の連絡先のデフォルト写真:',
    photo_live_preview: 'ライブプレビュー',
    photo_preview_desc: 'WhatsApp Webでプロフィール写真が変わる様子を確認:',
    photo_preview_select: '連絡先を選択...',
    photo_preview_as: 'プレビュー対象:',
    exit_preview_mode: 'プレビューモードを終了',
    contacts_loading: 'WhatsAppから連絡先を読み込み中...',
    contacts_open_wa: '連絡先を表示するにはWhatsApp Webを開いてください',
    contacts_used: '無料プラン:',
    contacts_upgrade: 'Proにアップグレード',
    quick_switch: '⇄ クイック切替',
    history_btn: '📋 履歴',
    select_contact: '連絡先を選択...',
    register_now: '今すぐ登録 →',
    save_number: '番号を保存',
    settings_appearance: '外観',
    settings_theme: 'テーマ',
    settings_theme_desc: 'お好みのカラースキームを選択',
    settings_preview: 'プレビュー',
    settings_test: 'セットアップをテスト',
    settings_test_desc: '連絡先が写真をどう見るかをプレビュー',
    settings_tutorial: 'チュートリアル',
    settings_replay: 'オンボーディングを再生',
    settings_replay_desc: '設定チュートリアルを再度確認',
    settings_replay_btn: '再生',
    settings_data: 'データ',
    settings_clear: 'すべてのデータを削除',
    settings_preview_btn: 'プレビュー',
    copied_btn: 'コピーしました！',
    switching: '⇄ 切替中…',
    switched: '✓ 切替完了！',
    no_contacts_wa: '連絡先が見つかりません。WhatsApp Webが読み込まれているか確認してください。',
    contacts_load_err: '連絡先を読み込めませんでした。WhatsApp Webを更新してみてください。',
    activating_preview: 'プレビューを起動中...',
    open_wa_first: 'プレビューを使用するにはまずWhatsApp Webを開いてください。',
    preview_failed: 'プレビューに失敗しました。',
    no_wa_connect: 'WhatsApp Webに接続できませんでした。',
    confirm_clear: 'すべてのデータを削除しますか？この操作は元に戻せません。',
    number_mismatch: '登録された番号が現在開いているWhatsAppアカウントと一致しません。',
    update_number: '番号を更新',
    how_to_refresh: '更新方法',
    refresh_instructions: 'WhatsApp WebタブでF5（またはMacでCmd+R）を押し、このポップアップを再度開いてください。',
    waiting_refresh: '更新を待機中…',
    wa_active: '✓ アクティブ',
    wa_open_first: 'まずWhatsApp Webを開いてください',
    reddit_meta1: 'r/whatsapp · 9年前',
    reddit_q1: '"人によって違うプロフィール写真を表示する方法はありますか？"',
    reddit_a1: 'ベストアンサー：できません。',
    reddit_meta2: 'r/whatsapp · 5年前',
    reddit_q2: '"ウェブとアプリで異なるプロフィール写真は可能ですか？"',
    reddit_a2: 'ベストアンサー：2つの番号があれば可能です。',
    reddit_meta3: 'r/whatsapp · 8ヶ月前',
    reddit_q3: '"WhatsAppは複数のプロフィール写真に対応すべき。"',
    reddit_a3: 'ベストアンサー：[削除済み]',
    tagline: '相手によって違う写真を見せよう',
    help_btn: 'ヘルプ',
    upgrade_title: 'DualProfile Proにアップグレード',
    upgrade_limit_msg: '無料プランの上限（連絡先2件）に達しました。',
    upgrade_monthly: '月額 — £9.99/月',
    upgrade_annual: '年間 — £59/年',
    tag_annual: '年間',
    tag_lifetime: 'Lifetime',
    upgrade_lifetime: '買い切り — £79',
    upgrade_payment_note: 'Lemon Squeezyで安全に決済。',
    upgrade_license_label: '購入済みの方はライセンスキーを入力してください：',
    upgrade_activate: '有効化',
    upgrade_validating: 'ライセンスを確認中...',
    upgrade_license_err: 'ライセンスキーを入力してください',
    upgrade_close: '閉じる',
    upgrade_coming_soon_badge: '🚀 近日公開！',
    upgrade_coming_soon_msg: 'Chrome Web StoreリリースレースのPro機能が利用可能になります。',
    upgrade_email_placeholder: '早期アクセス用メールアドレスを入力',
    upgrade_notify_btn: '通知を受け取る',
    upgrade_signup_note: 'Proがリリースされたら最初に知る！',
    upgrade_on_list: 'リストに登録されました！',
    upgrade_already_on_list: 'すでにリストに登録済みです！',
    upgrade_email_confirm: '以下のメールアドレスに送信します：',
    upgrade_launch_note: 'Pro機能がリリースされたときに。',
    upgrade_notify_note: 'Proがリリースされたらお知らせします。',
    lets_go: 'さあ始めよう',
    pro_features_title: 'プランと機能',
    pro_unlimited_title: '無制限の連絡先',
    pro_unlimited_desc: '好きなだけ連絡先に割り当て可能',
    pro_quickswitch_title: 'クイック切替',
    pro_quickswitch_desc: 'ワンタップで全P1 ⇄ P2を切替',
    pro_history_title: '割り当て履歴',
    pro_history_desc: 'すべての変更の完全なログ',
    pro_support_title: '優先サポート',
    pro_support_desc: 'チームへのダイレクトメール',
    pro_workmode_title: '仕事/プライベートモード',
    pro_workmode_desc: '近日公開',
    pro_photohistory_title: '写真履歴と復元',
    pro_photohistory_desc: '最近アップロードした3枚の写真を復元',
    feat_bulk_title: '一括連絡先割り当て',
    pro_schedule_title: 'スケジュール写真',
    pro_schedule_desc: '曜日と時間で自動切替',
    pro_export_title: '割り当てのエクスポート/インポート',
    pro_export_desc: '連絡先の割り当てをバックアップ・復元',
    pro_multidevice_title: 'マルチデバイス同期',
    pro_multidevice_desc: '設定がすべてのデバイスで同期されます',
    history_panel_title: '写真履歴',
    history_slot1: '写真1の履歴', history_slot2: '写真2の履歴',
    history_restore_btn: '復元',
    history_empty: '履歴はまだありません — 過去の写真がここに表示されます',
    history_restored_toast: '写真が正常に復元されました',
    history_pro_gate: '写真履歴はProの機能です',
    schedule_panel_title: 'スケジュール写真',
    schedule_enable_label: 'スケジュールを有効化',
    schedule_photo_label: 'ウィンドウ中のアクティブ写真',
    schedule_days_label: 'アクティブな曜日',
    schedule_start_label: '開始時間', schedule_end_label: '終了時間',
    schedule_save_btn: 'スケジュール保存', schedule_saved_toast: 'スケジュール保存完了',
    schedule_pro_gate: 'スケジュール写真は年間プランの機能です',
    schedule_day_sun: '日', schedule_day_mon: '月', schedule_day_tue: '火',
    schedule_day_wed: '水', schedule_day_thu: '木', schedule_day_fri: '金', schedule_day_sat: '土',
    schedule_active_badge: 'スケジュール有効',
    export_btn: '割り当てをエクスポート', import_btn: '割り当てをインポート',
    export_success_toast: 'エクスポート完了', import_success_toast: 'インポート完了',
    import_error_toast: '無効なファイル', export_pro_gate: 'エクスポート/インポートはLifetimeの機能です',
    unlock_pro: 'プランを見る — £9.99/月〜',
    unlock_annual: '年間プランにアップグレード — £59/年 · 一括割り当て',
    bulk_mode_label: '一括選択',
    bulk_assigned_p1: 'フォト1に割り当て済み',
    bulk_assigned_p2: 'フォト2に割り当て済み',
    bulk_teaser: '仕事の連絡先をまとめて選択できます。年間プラン。',
    coming_soon: '近日公開',
    history_contacts_flipped: '件の連絡先を切替',
    history_removed: '削除済み',
    help_title: 'DualProfileの使い方',
    help_li1: '2枚の異なるプロフィール写真をアップロード',
    help_li2: '連絡先タブで各写真に連絡先を割り当て',
    help_li3: '写真1の連絡先には写真1が表示される',
    help_li4: '写真2の連絡先には写真2が表示される',
    help_li5: 'ライブプレビューで確認しよう！',
    help_free_title: '無料プラン',
    help_free_desc: '無料で最大2件の連絡先を割り当て可能。無制限にはProへアップグレード。',
    help_trouble_title: 'トラブルシューティング',
    help_trouble_desc: '連絡先が読み込まれない場合は、WhatsApp Webが開いて完全に読み込まれているか確認してください。チャットリストをスクロールしてから試してください。',
    preview_setup_title: 'セットアップをプレビュー',
    preview_setup_desc: '連絡先にはこのようにあなたの写真が表示されます：',
    preview_no_photo_label: '写真なし',
    preview_close: '閉じる',
    waiting_for_install: 'インストール待機中',
    to_install: '…',
    p2p_sync_active: 'P2P同期有効',
    sync_inactive: '無効',
    sync_not_configured: '未設定 — config.jsにConvex/Cloudinaryを設定してください',
    enter_phone_for_sync: 'P2P同期を有効にするには番号を入力してください',
    number_saved: '✓ 番号を保存しました！P2P同期が有効になりました。',
    change: '変更',
    wa_is_active: 'DualProfileが有効です',
    sync_is_live: '同期が有効です。連絡先に写真を割り当てられます。',
    no_photo_assignment: 'この割り当てに写真がアップロードされていません。',
    no_history_found: '履歴が見つかりません。',
    one_more_step: 'もう一ステップ',
    hard_refresh_msg: 'DualProfileを有効化するためにWhatsApp Webをハードリフレッシュしてください。WhatsAppのタブでCtrl+Shift+R（Mac：Cmd+Shift+R）を押してください。',
    upgrade_working_title: '見えています。🎉',
    upgrade_working_sub: '最初に設定した連絡先が、あなたが選んだ写真を見ています。全員に正しいあなたを見せませんか？',
    upgrade_working_cta: '全連絡先を解放する',
    upgrade_limit_msg_1: '無料プラン：1件の連絡先を含む。',
        trial_setup_mode: 'セットアップ中',
    trial_setup_desc: '準備を整えましょう — 最初の連絡先が同期したときにトライアルが始まります。',
    trial_active_badge: 'あと{days}日',
    trial_active_badge_1: '最終日',
    trial_started_title: 'トライアルが始まりました。',
    existing_user_trial_title: '🎁 新しいプレミアム機能が追加されました。',
    existing_user_trial_desc: '3日間無料でフルアクセスをお楽しみください。',
    trial_started_desc: '3日間のフルアクセス。残り時間が少なくなったらお知らせします。',
    trial_expiring_title: 'トライアルは明日終了します',
    trial_expiring_desc: '明日以降、1件の連絡先がアクティブのまま残ります。残りは凍結されます（削除ではありません）。',
    trial_expired_badge: 'トライアル終了',
    trial_expired_title: 'トライアルが終了しました。',
    trial_expired_desc: '無料プランをご利用中です。1件の連絡先がアクティブ、残りは凍結されています。',
    trial_locked_contact: '凍結中 — 再有効化するにはアップグレード',
    trial_active_contact: '無料プランでアクティブ',
    trial_upgrade_to_unlock: '{count}件の連絡先をすべて解放するにはアップグレード',
    trial_upgrade_title: '構築したすべてを解放しましょう。',
    trial_upgrade_sub: '{count}件の連絡先が凍結されています。Proにアップグレードしてすべてを即座に再有効化しましょう。',
    trial_upgrade_cta: 'すべての連絡先を再有効化',
    trial_days_remaining: 'あと{days}日',
    trial_hours_remaining: 'あと{hours}時間',
    trial_expires_today: 'トライアルは今日終了します',
    trial_label: '無料トライアル',
    trial_full_access: 'フルアクセス',
    trial_not_started: 'トライアル未開始',
        phone_registered_placeholder: '番号登録済み',
        settings_phone_label: 'WhatsApp番号',
    settings_phone_helper: 'P2P写真同期に必要。ハッシュのみ保存されます。',
    settings_phone_label: 'WhatsApp番号',
    settings_phone_helper: 'P2P写真同期に必要。ハッシュのみ保存されます。',
        settings_phone_label: 'WhatsApp番号',
    settings_phone_helper: 'P2P写真同期に必要。ハッシュのみ保存されます。',
        refresh_prompt_waiting: '待機中...',
  },
  fr: {
    lang_label: 'Langue',
    headline: 'Vous changez déjà votre façon de parler selon qui vous écoute.',
    headline_bridge: 'Pas votre photo. Les gens réclament ça depuis des années :',
    now_exists: 'Maintenant, ça existe.',
    sub: "Attribuez des photos différentes à différents contacts — votre patron en voit une, vos amis une autre. Changée automatiquement. Même numéro, même WhatsApp.",
    free_to_start: 'Gratuit pour commencer',
    works_on_web: 'Fonctionne sur WhatsApp Web',
    two_minutes: '2 minutes de configuration',
    show_me: 'Montrez-moi comment',
    pair_title: 'DualProfile fonctionne entre deux personnes.',
    pair_sub: "Quand vous assignez une photo à quelqu\'un, cette personne doit aussi avoir DualProfile. Envoyez-lui le lien maintenant.",
    copy_link: "📎 Copier le lien d\'installation",
    copied_msg: 'Copié — collez-le dans WhatsApp et continuez',
    p2p_reminder_msg: "{name} verra cette photo une fois qu'il ou elle aura aussi installe DualProfile.",
    continue_setup: 'Continuer la configuration',
    invite_later: "Je l\'inviterai plus tard",
    upload_title: 'Téléchargez vos deux photos.',
    upload_sub: 'Une pour le travail. Une pour le reste.',
    phone_title: 'Entrez votre numéro WhatsApp.',
    phone_sub: 'Cela lie vos photos à votre identité WhatsApp.',
    refresh_title: 'Actualisez WhatsApp Web.',
    refresh_sub: 'Cela active DualProfile dans WhatsApp.',
    assign_title: 'Assignez des photos aux contacts.',
    assign_sub: 'Assignez la Photo 1 ou la Photo 2 à chaque contact.',
    live_title: 'Vous êtes en ligne.',
    live_sub: "Dès que votre contact installe et s\'enregistre, votre photo assignée apparaît automatiquement sur son écran.",
    open_wa: 'Ouvrir WhatsApp Web',
    copy_share: 'Copier le lien à partager',
    copy_share_confirm: 'Copié — collez-le à votre contact sur WhatsApp',
    step_badge_1of3: 'Étape 1 sur 3',
    upload_title2: 'Téléchargez vos deux photos',
    upload_sub2: 'Une pour le travail. Une pour la vie. Vous décidez qui voit laquelle.',
    upload_note: 'Une seule photo suffit pour continuer — ajoutez la deuxième plus tard.',
    upload_photo1_label: 'Photo 1',
    upload_photo2_label: 'Photo 2',
    upload_tap: 'Appuyez pour télécharger',
    upload_hint1: 'ex : professionnelle, photo de travail',
    upload_hint2: 'ex : personnelle, décontractée, le vrai vous',
    upload_error: 'Téléchargez au moins une photo pour continuer.',
    upload_too_large: 'Cette image est trop grande. Utilisez-en une de moins de 5 Mo.',
    upload_continue: 'Continuer',
    step_badge_2of3: 'Étape 2 sur 3',
    phone_title2: 'Enregistrez votre numéro WhatsApp',
    phone_sub2: "C\'est ainsi que les autres utilisateurs DualProfile vous reconnaissent et que votre photo assignée apparaît automatiquement sur leur écran.",
    phone_note: "Incluez votre indicatif pays. Votre numéro n\'est jamais stocké directement — il est immédiatement converti en code sécurisé privé.",
    phone_error: "Veuillez saisir un numéro valide avec l\'indicatif pays.",
    phone_save: 'Enregistrer et continuer',
    phone_skip: 'Je le ferai plus tard',
    phone_saving: 'Enregistrement...',
    phone_warn_title: 'Avant de passer — voici ce que vous perdrez',
    phone_warn_li1: "Les autres utilisateurs DualProfile ne sauront pas que vous avez l\'extension — ils verront un bouton Inviter au lieu de votre profil.",
    phone_warn_li2: 'Vos photos assignées ne se synchroniseront pas en temps réel.',
    phone_warn_li3: "Sans votre numéro, DualProfile ne fonctionne qu\'à moitié pour vous.",
    phone_warn_register: 'Enregistrer mon numéro',
    phone_warn_skip: "Passer pour l\'instant",
    refresh_title2: 'Actualisez votre onglet WhatsApp Web',
    refresh_sub2: 'Cela active DualProfile dans WhatsApp et lui permet de détecter vos contacts.',
    refresh_step1: 'Passez à votre onglet WhatsApp Web',
    refresh_step2: 'Appuyez sur F5 ou Ctrl+R · Mac : Cmd+R',
    refresh_step3: 'Revenez ici et appuyez sur Continuer',
    refresh_done: 'Fait — continuer',
    refresh_not_open: "WhatsApp n\'est pas ouvert en ce moment",
    step_badge_3of3: 'Étape 3 sur 3',
    assign_title2: 'Qui voit quelle photo ?',
    assign_sub2: "Assignez la Photo 1 ou la Photo 2 à chaque contact. Modifiable à tout moment depuis l\'onglet Contacts.",
    assign_scroll_title: 'Une chose avant de charger vos contacts',
    assign_scroll_sub: 'Passez à votre onglet WhatsApp Web et faites défiler vos chats vers le bas — cela garantit que tous vos contacts sont chargés.',
    assign_load_btn: 'Fait — charger mes contacts',
    assign_photo1_legend: 'Votre première photo',
    assign_photo2_legend: 'Votre deuxième photo',
    assign_loading: 'Chargement des contacts depuis WhatsApp...',
    assign_no_contacts: 'Aucun contact trouvé. Allez dans WhatsApp Web, faites défiler vos chats, puis appuyez sur Réessayer.',
    assign_retry: 'Réessayer',
    assign_finish: 'Terminer la configuration',
    assign_skip: "J\'assignerai des contacts plus tard",
    assign_free_limit: "Plan gratuit : jusqu\'à",
    assign_free_contacts: 'contacts.',
    assign_upgrade: 'Passer à Pro →',
    live_badge_active: '● EN DIRECT',
    live_badge_almost: '⚠ Presque prêt',
    live_title_full: "Désormais, chaque personne voit exactement ce que vous voulez qu\'elle voie.",
    live_title_almost: 'Presque prêt — une dernière étape.',
    live_will_see_p1: 'Verra votre Photo 1 ✓',
    live_will_see_p2: 'Verra votre Photo 2 ✓',
    live_no_assign: "Vos photos sont prêtes. Assignez des contacts à tout moment depuis l\'onglet Contacts.",
    live_check_photos: 'Photos téléchargées',
    live_check_registered: 'Connecté au réseau DualProfile',
    live_check_not_registered: 'Numéro non enregistré —',
    live_fix_this: 'corriger →',
    live_warn_detail: 'Sans votre numéro, les contacts voient un bouton Inviter au lieu de votre photo et la synchronisation en temps réel ne fonctionne pas.',
    live_fully_active: 'DualProfile entièrement actif',
    live_partly_active: 'DualProfile partiellement actif',
    live_nudge: 'Besoin de plus de 2 contacts ?',
    live_upgrade: 'Passer à Pro →',
    live_network_title: 'Important — comment fonctionne DualProfile',
    live_network_body: "Pour qu\'un contact voie votre photo assignée, il doit aussi avoir DualProfile installé. Une fois installé, votre photo apparaît automatiquement sur son écran — sans étapes supplémentaires.",
    live_copy_link: "Copier le lien d\'installation",
    live_copied: 'Copié — collez-le à votre contact sur WhatsApp',
    live_continue: 'Continuer',
    tab_preview: 'Aperçu',
    tab_photos: 'Photos',
    tab_contacts: 'Contacts',
    tab_settings: 'Paramètres',
    status_active: 'Extension active',
    status_disabled: 'Extension désactivée',
    preview_hero_title: 'Simulation en direct',
    preview_hero_sub: 'Voyez exactement comment les autres vous voient sur WhatsApp',
    preview_label: 'Aperçu en tant que :',
    preview_select: 'Sélectionner un contact...',
    preview_hint: 'Votre photo de profil WhatsApp se met à jour en direct',
    preview_exit_btn: "Quitter l'aperçu",
    preview_no_photo: "Téléchargez des photos d'abord, puis sélectionnez un contact ci-dessus",
    preview_go_photos: 'Télécharger des photos →',
    invite_choose_style: 'Choisissez votre style :',
    invite_copy_btn: 'Copier le message',
    invite_wa_btn: 'Envoyer sur WhatsApp →',
    photo_click_upload: 'Cliquer pour télécharger',
    photo1_label: 'Photo 1',
    photo2_label: 'Photo 2',
    photo_default_label: 'Photo par défaut pour les contacts non listés :',
    photo_live_preview: 'Aperçu en direct',
    photo_preview_desc: 'Voyez votre photo de profil changer dans WhatsApp Web :',
    photo_preview_select: 'Sélectionner un contact...',
    photo_preview_as: 'Aperçu en tant que :',
    exit_preview_mode: 'Quitter le mode aperçu',
    contacts_loading: 'Chargement des contacts depuis WhatsApp...',
    contacts_open_wa: 'Ouvrez WhatsApp Web pour voir les contacts',
    contacts_used: 'Plan gratuit :',
    contacts_upgrade: 'Passer à Pro',
    quick_switch: '⇄ Changement rapide',
    history_btn: '📋 Historique',
    select_contact: 'Sélectionner un contact...',
    register_now: "S'inscrire →",
    save_number: 'Enregistrer le numéro',
    settings_appearance: 'Apparence',
    settings_theme: 'Thème',
    settings_theme_desc: 'Choisissez votre palette de couleurs préférée',
    settings_preview: 'Aperçu',
    settings_test: 'Testez votre configuration',
    settings_test_desc: 'Prévisualisez comment les contacts verront vos photos',
    settings_tutorial: 'Tutoriel',
    settings_replay: "Revoir l'intégration",
    settings_replay_desc: 'Regarder à nouveau le tutoriel de configuration',
    settings_replay_btn: 'Revoir',
    settings_data: 'Données',
    settings_clear: 'Effacer toutes les données',
    settings_preview_btn: 'Aperçu',
    copied_btn: 'Copié !',
    switching: '⇄ Changement…',
    switched: '✓ Changé !',
    no_contacts_wa: 'Aucun contact trouvé. Assurez-vous que WhatsApp Web est chargé.',
    contacts_load_err: 'Impossible de charger les contacts. Essayez de rafraîchir WhatsApp Web.',
    activating_preview: "Activation de l'aperçu...",
    open_wa_first: "Ouvrez d'abord WhatsApp Web pour utiliser l'aperçu.",
    preview_failed: 'Aperçu échoué.',
    no_wa_connect: 'Impossible de se connecter à WhatsApp Web.',
    confirm_clear: 'Effacer toutes les données ? Cette action est irréversible.',
    number_mismatch: 'Votre numéro enregistré ne correspond pas au compte WhatsApp actuellement ouvert.',
    update_number: 'Mettre à jour le numéro',
    how_to_refresh: 'Comment rafraîchir',
    refresh_instructions: 'Appuyez sur F5 (ou Cmd+R sur Mac) dans votre onglet WhatsApp Web, puis rouvrez ce popup.',
    waiting_refresh: 'En attente du rafraîchissement…',
    wa_active: '✓ Actif',
    wa_open_first: "Ouvrez d'abord WhatsApp Web",
    reddit_meta1: 'r/whatsapp · il y a 9 ans',
    reddit_q1: "\"Y a-t-il un moyen d'afficher des photos de profil différentes à différentes personnes ?\"",
    reddit_a1: 'Meilleure réponse : Non.',
    reddit_meta2: 'r/whatsapp · il y a 5 ans',
    reddit_q2: '"Photo de profil différente entre web et app — est-ce possible ?"',
    reddit_a2: 'Meilleure réponse : Seulement avec deux numéros.',
    reddit_meta3: 'r/whatsapp · il y a 8 mois',
    reddit_q3: '"WhatsApp devrait prendre en charge plusieurs photos de profil."',
    reddit_a3: 'Meilleure réponse : [supprimé]',
    tagline: 'Des photos différentes pour des personnes différentes',
    help_btn: 'Aide',
    upgrade_title: 'Passez à DualProfile Pro',
    upgrade_limit_msg: 'Vous avez atteint la limite gratuite (2 contacts).',
    upgrade_monthly: 'Mensuel — £9.99/mois',
    upgrade_annual: 'Annuel — £59/an',
    tag_annual: 'Annuel',
    tag_lifetime: 'Lifetime',
    upgrade_lifetime: 'À vie — £79 une fois',
    upgrade_payment_note: 'Paiement sécurisé via Lemon Squeezy.',
    upgrade_license_label: 'Déjà acheté ? Entrez votre clé de licence :',
    upgrade_activate: 'Activer',
    upgrade_validating: 'Validation de la licence...',
    upgrade_license_err: 'Veuillez entrer votre clé de licence',
    upgrade_close: 'Fermer',
    upgrade_coming_soon_badge: '🚀 Bientôt disponible !',
    upgrade_coming_soon_msg: 'Les fonctionnalités Pro seront disponibles après le lancement sur Chrome Web Store.',
    upgrade_email_placeholder: 'Entrez votre email pour un accès anticipé',
    upgrade_notify_btn: 'Me notifier',
    upgrade_signup_note: 'Soyez le premier à savoir quand Pro sera lancé !',
    upgrade_on_list: 'Vous êtes sur la liste !',
    upgrade_already_on_list: 'Vous êtes déjà sur la liste !',
    upgrade_email_confirm: 'Nous vous enverrons un email à :',
    upgrade_launch_note: 'quand les fonctionnalités Pro seront lancées.',
    upgrade_notify_note: 'Nous vous préviendrons quand Pro sera lancé.',
    lets_go: "C'est parti",
    pro_features_title: 'Offres et fonctionnalités',
    pro_unlimited_title: 'Contacts illimités',
    pro_unlimited_desc: 'Assignez autant de contacts que vous le souhaitez',
    pro_quickswitch_title: 'Changement rapide',
    pro_quickswitch_desc: 'Inversez tous P1 ⇄ P2 en un geste',
    pro_history_title: "Historique d'assignation",
    pro_history_desc: 'Journal complet de chaque modification',
    pro_support_title: 'Support prioritaire',
    pro_support_desc: "Accès direct à l'équipe par email",
    pro_workmode_title: 'Mode travail / personnel',
    pro_workmode_desc: 'Bientôt disponible',
    pro_photohistory_title: 'Historique photos et retour arrière',
    pro_photohistory_desc: "Restaurez l'une de vos 3 dernières photos",
    feat_bulk_title: 'Attribution groupée des contacts',
    pro_schedule_title: 'Photos programmées',
    pro_schedule_desc: 'Changez de photo automatiquement par jour et heure',
    pro_export_title: 'Exporter et importer les assignations',
    pro_export_desc: 'Sauvegardez et restaurez vos assignations',
    pro_multidevice_title: 'Synchronisation multi-appareils',
    pro_multidevice_desc: 'Vos préférences se synchronisent sur tous vos appareils',
    history_panel_title: 'Historique des photos',
    history_slot1: 'Historique photo 1', history_slot2: 'Historique photo 2',
    history_restore_btn: 'Restaurer',
    history_empty: "Pas encore d'historique — les photos précédentes apparaîtront ici",
    history_restored_toast: 'Photo restaurée avec succès',
    history_pro_gate: "L'historique des photos est une fonction Pro",
    schedule_panel_title: 'Photos programmées',
    schedule_enable_label: 'Activer le planning',
    schedule_photo_label: 'Photo active pendant la fenêtre',
    schedule_days_label: 'Jours actifs',
    schedule_start_label: 'Heure de début', schedule_end_label: 'Heure de fin',
    schedule_save_btn: 'Enregistrer le planning', schedule_saved_toast: 'Planning enregistré',
    schedule_pro_gate: 'Les photos programmées sont une fonction Annuelle',
    schedule_day_sun: 'Dim', schedule_day_mon: 'Lun', schedule_day_tue: 'Mar',
    schedule_day_wed: 'Mer', schedule_day_thu: 'Jeu', schedule_day_fri: 'Ven', schedule_day_sat: 'Sam',
    schedule_active_badge: 'Planning actif',
    export_btn: 'Exporter les assignations', import_btn: 'Importer les assignations',
    export_success_toast: 'Assignations exportées', import_success_toast: 'Assignations importées',
    import_error_toast: 'Fichier invalide', export_pro_gate: "L'export/import est une fonction Lifetime",
    unlock_pro: 'Voir les offres — dès £9.99/mois',
    unlock_annual: 'Débloquer Annuel — £59/an · Attribution groupée',
    bulk_mode_label: 'Sélection groupée',
    bulk_assigned_p1: 'Attribué à la Photo 1',
    bulk_assigned_p2: 'Attribué à la Photo 2',
    bulk_teaser: 'Sélectionnez tous vos contacts professionnels en une fois. Plan annuel.',
    coming_soon: 'Bientôt disponible',
    history_contacts_flipped: 'contacts inversés',
    history_removed: 'supprimé',
    help_title: 'Comment utiliser DualProfile',
    help_li1: '2 photos de profil différentes',
    help_li2: 'Allez dans Contacts et assignez des contacts à chaque photo',
    help_li3: 'Les contacts de Photo 1 verront la Photo 1',
    help_li4: 'Les contacts de Photo 2 verront la Photo 2',
    help_li5: 'Utilisez la prévisualisation en direct pour tester !',
    help_free_title: 'Plan gratuit',
    help_free_desc: "Vous pouvez assigner jusqu'à 2 contacts gratuitement. Passez à Pro pour des contacts illimités.",
    help_trouble_title: 'Dépannage',
    help_trouble_desc: "Si les contacts ne se chargent pas, assurez-vous que WhatsApp Web est ouvert. Essayez de défiler dans votre liste de chats d'abord.",
    preview_setup_title: 'Aperçu de votre configuration',
    preview_setup_desc: 'Voici comment vos contacts verront vos photos :',
    preview_no_photo_label: 'Pas de photo',
    preview_close: 'Fermer',
    waiting_for_install: 'En attente que',
    to_install: 'installe…',
    p2p_sync_active: 'Synchronisation P2P active',
    sync_inactive: 'Inactif',
    sync_not_configured: 'Non configuré — définissez Convex/Cloudinary dans config.js',
    enter_phone_for_sync: 'Entrez votre numéro pour activer la sync P2P',
    number_saved: '✓ Numéro enregistré ! La sync P2P est maintenant active.',
    change: 'Modifier',
    wa_is_active: 'DualProfile est actif',
    sync_is_live: 'La sync est active. Vous pouvez assigner des photos aux contacts.',
    no_photo_assignment: 'Aucune photo pour cette assignation.',
    no_history_found: 'Aucun historique trouvé.',
    one_more_step: 'Encore une étape',
    hard_refresh_msg: 'Rechargez WhatsApp Web maintenant pour activer DualProfile. Appuyez sur Ctrl+Shift+R (Mac : Cmd+Shift+R) dans votre onglet WhatsApp.',
    upgrade_working_title: 'Ils vous voient. 🎉',
    upgrade_working_sub: 'Votre premier contact assigné voit exactement la photo que vous avez choisie. Envie que tous vos contacts voient la bonne version de vous ?',
    upgrade_working_cta: 'Débloquer tous les contacts',
    upgrade_limit_msg_1: 'Plan gratuit : 1 contact inclus.',
        trial_setup_mode: 'Configuration',
    trial_setup_desc: 'Préparez tout — votre essai commence quand votre premier contact se synchronise.',
    trial_active_badge: '{days} jours restants',
    trial_active_badge_1: 'Dernier jour',
    trial_started_title: 'Votre essai a commencé.',
    existing_user_trial_title: '🎁 Nouvelles fonctionnalités premium ajoutées.',
    existing_user_trial_desc: "Profitez d'un accès complet gratuit pendant 3 jours.",
    trial_started_desc: "3 jours d'accès complet. Nous vous préviendrons quand le temps est presque écoulé.",
    trial_expiring_title: "L'essai se termine demain",
    trial_expiring_desc: "Après aujourd'hui, 1 contact restera actif. Les autres seront gelés, pas supprimés.",
    trial_expired_badge: 'Essai terminé',
    trial_expired_title: 'Votre essai est terminé.',
    trial_expired_desc: 'Vous êtes sur le plan gratuit. 1 contact reste actif. Les autres sont gelés.',
    trial_locked_contact: 'Gelé — mettez à niveau pour réactiver',
    trial_active_contact: 'Actif sur le plan gratuit',
    trial_upgrade_to_unlock: 'Passez à Pro pour débloquer les {count} contacts',
    trial_upgrade_title: 'Débloquez tout ce que vous avez construit.',
    trial_upgrade_sub: '{count} contacts sont gelés. Passez à Pro pour les réactiver tous instantanément.',
    trial_upgrade_cta: 'Réactiver tous les contacts',
    trial_days_remaining: '{days} jours restants',
    trial_hours_remaining: '{hours} heures restantes',
    trial_expires_today: "L'essai expire aujourd'hui",
    trial_label: 'Essai gratuit',
    trial_full_access: 'Accès complet',
    trial_not_started: 'Essai non commencé',
        phone_registered_placeholder: 'Téléphone enregistré',
        settings_phone_label: 'Votre numéro WhatsApp',
    settings_phone_helper: 'Requis pour la synchronisation photo P2P. Stocké en hash uniquement.',
    settings_phone_label: 'Votre numéro WhatsApp',
    settings_phone_helper: 'Requis pour la synchronisation photo P2P. Stocké en hash uniquement.',
        settings_phone_label: 'Votre numéro WhatsApp',
    settings_phone_helper: 'Requis pour la synchronisation photo P2P. Stocké en hash uniquement.',
        refresh_prompt_waiting: 'En attente...',
  },
  pt: {
    lang_label: 'Idioma',
    headline: 'Você já muda a forma como fala dependendo de quem está ouvindo.',
    headline_bridge: 'Sua foto não. Acontece que as pessoas pedem isso há anos:',
    now_exists: 'Agora existe.',
    sub: 'Atribua fotos diferentes a contatos diferentes — seu chefe vê uma, seus amigos veem outra. Trocada automaticamente. Mesmo número, mesmo WhatsApp.',
    free_to_start: 'Grátis para começar',
    works_on_web: 'Funciona no WhatsApp Web',
    two_minutes: '2 minutos para configurar',
    show_me: 'Mostre-me como',
    pair_title: 'DualProfile funciona entre duas pessoas.',
    pair_sub: 'Quando você atribui uma foto a alguém, essa pessoa também precisa do DualProfile. Envie o link agora, antes de terminar a configuração.',
    copy_link: '📎 Copiar link de instalação',
    copied_msg: 'Copiado — cole no WhatsApp e continue',
    p2p_reminder_msg: '{name} vera esta foto assim que tambem instalar o DualProfile.',
    continue_setup: 'Continuar configuração',
    invite_later: 'Vou convidar depois',
    upload_title: 'Envie suas duas fotos.',
    upload_sub: 'Uma para o trabalho. Uma para tudo o mais.',
    phone_title: 'Digite seu número do WhatsApp.',
    phone_sub: 'Isso vincula suas fotos à sua identidade no WhatsApp.',
    refresh_title: 'Atualize o WhatsApp Web.',
    refresh_sub: 'Isso ativa o DualProfile dentro do WhatsApp.',
    assign_title: 'Atribua fotos aos contatos.',
    assign_sub: 'Atribua a Foto 1 ou a Foto 2 a cada contato.',
    live_title: 'Você está ativo.',
    live_sub: 'Assim que seu contato instalar e se registrar, sua foto atribuída aparecerá automaticamente na tela dele.',
    open_wa: 'Abrir WhatsApp Web',
    copy_share: 'Copiar link para compartilhar',
    copy_share_confirm: 'Copiado — cole para seu contato no WhatsApp',
    step_badge_1of3: 'Passo 1 de 3',
    upload_title2: 'Envie suas duas fotos',
    upload_sub2: 'Uma para o trabalho. Uma para a vida. Você decide quem vê qual.',
    upload_note: 'Você precisa de apenas uma foto para continuar — adicione a segunda depois.',
    upload_photo1_label: 'Foto 1',
    upload_photo2_label: 'Foto 2',
    upload_tap: 'Toque para enviar',
    upload_hint1: 'ex.: profissional, foto de trabalho',
    upload_hint2: 'ex.: pessoal, casual, o verdadeiro você',
    upload_error: 'Envie pelo menos uma foto para continuar.',
    upload_too_large: 'Essa imagem é muito grande. Use uma com menos de 5MB.',
    upload_continue: 'Continuar',
    step_badge_2of3: 'Passo 2 de 3',
    phone_title2: 'Registre seu número do WhatsApp',
    phone_sub2: 'É assim que outros usuários do DualProfile te reconhecem — e como sua foto atribuída chega à tela deles automaticamente.',
    phone_note: 'Inclua o código do país. Seu número nunca é armazenado diretamente — é convertido instantaneamente em um código seguro privado.',
    phone_error: 'Insira um número válido com o código do país.',
    phone_save: 'Salvar e continuar',
    phone_skip: 'Farei isso depois',
    phone_saving: 'Salvando...',
    phone_warn_title: 'Antes de pular — veja o que você vai perder',
    phone_warn_li1: 'Outros usuários do DualProfile não saberão que você tem a extensão — verão um botão Convidar em vez do seu perfil.',
    phone_warn_li2: 'Suas fotos atribuídas não sincronizarão em tempo real.',
    phone_warn_li3: 'Sem seu número, o DualProfile funciona pela metade para você.',
    phone_warn_register: 'Registrar meu número',
    phone_warn_skip: 'Pular por agora',
    refresh_title2: 'Atualize sua aba do WhatsApp Web',
    refresh_sub2: 'Isso ativa o DualProfile dentro do WhatsApp e permite detectar seus contatos.',
    refresh_step1: 'Mude para sua aba do WhatsApp Web',
    refresh_step2: 'Pressione F5 ou Ctrl+R · Mac: Cmd+R',
    refresh_step3: 'Volte aqui e toque em Continuar',
    refresh_done: 'Pronto — continuar',
    refresh_not_open: 'O WhatsApp não está aberto agora',
    step_badge_3of3: 'Passo 3 de 3',
    assign_title2: 'Quem vê qual foto?',
    assign_sub2: 'Atribua a Foto 1 ou a Foto 2 a cada contato. Você pode mudar isso a qualquer momento na aba Contatos.',
    assign_scroll_title: 'Uma coisa antes de carregar seus contatos',
    assign_scroll_sub: 'Mude para sua aba do WhatsApp Web e role seus chats para baixo — isso garante que todos seus contatos sejam carregados.',
    assign_load_btn: 'Pronto — carregar meus contatos',
    assign_photo1_legend: 'Sua primeira foto',
    assign_photo2_legend: 'Sua segunda foto',
    assign_loading: 'Carregando contatos do WhatsApp...',
    assign_no_contacts: 'Nenhum contato encontrado. Vá ao WhatsApp Web, role seus chats e toque em Tentar novamente.',
    assign_retry: 'Tentar novamente',
    assign_finish: 'Concluir configuração',
    assign_skip: 'Atribuirei contatos depois',
    assign_free_limit: 'Plano grátis: até',
    assign_free_contacts: 'contatos.',
    assign_upgrade: 'Fazer upgrade para Pro →',
    live_badge_active: '● AO VIVO',
    live_badge_almost: '⚠ Quase lá',
    live_title_full: 'A partir de agora, cada pessoa vê exatamente quem você quer que veja.',
    live_title_almost: 'Quase pronto — um passo restante.',
    live_will_see_p1: 'Verá sua Foto 1 ✓',
    live_will_see_p2: 'Verá sua Foto 2 ✓',
    live_no_assign: 'Suas fotos estão prontas. Atribua contatos quando quiser na aba Contatos.',
    live_check_photos: 'Fotos enviadas',
    live_check_registered: 'Conectado à rede DualProfile',
    live_check_not_registered: 'Número não registrado —',
    live_fix_this: 'corrigir →',
    live_warn_detail: 'Sem seu número, os contatos veem um botão Convidar em vez da sua foto e a sincronização em tempo real não funciona.',
    live_fully_active: 'DualProfile totalmente ativo',
    live_partly_active: 'DualProfile parcialmente ativo',
    live_nudge: 'Precisa de mais de 2 contatos?',
    live_upgrade: 'Fazer upgrade para Pro →',
    live_network_title: 'Importante — como o DualProfile funciona',
    live_network_body: 'Para um contato ver sua foto atribuída, ele também precisa ter o DualProfile instalado. Uma vez instalado, sua foto aparece na tela dele automaticamente — sem passos extras.',
    live_copy_link: 'Copiar link de instalação',
    live_copied: 'Copiado — cole para seu contato no WhatsApp',
    live_continue: 'Continuar',
    tab_preview: 'Pré-visualização',
    tab_photos: 'Fotos',
    tab_contacts: 'Contatos',
    tab_settings: 'Configurações',
    status_active: 'Extensão ativa',
    status_disabled: 'Extensão desativada',
    preview_hero_title: 'Simulação ao vivo',
    preview_hero_sub: 'Veja exatamente como diferentes pessoas te veem no WhatsApp',
    preview_label: 'Pré-visualizar como:',
    preview_select: 'Selecionar um contato...',
    preview_hint: 'Sua foto de perfil do WhatsApp atualiza ao vivo ao trocar de contato',
    preview_exit_btn: 'Sair da pré-visualização',
    preview_no_photo: 'Envie fotos primeiro, depois selecione um contato acima',
    preview_go_photos: 'Enviar fotos →',
    invite_choose_style: 'Escolha seu estilo:',
    invite_copy_btn: 'Copiar mensagem',
    invite_wa_btn: 'Enviar pelo WhatsApp →',
    photo_click_upload: 'Clique para enviar',
    photo1_label: 'Foto 1',
    photo2_label: 'Foto 2',
    photo_default_label: 'Foto padrão para contatos não listados:',
    photo_live_preview: 'Pré-visualização ao vivo',
    photo_preview_desc: 'Veja sua foto de perfil mudar no WhatsApp Web:',
    photo_preview_select: 'Selecionar contato...',
    photo_preview_as: 'Pré-visualizar como:',
    exit_preview_mode: 'Sair do modo de pré-visualização',
    contacts_loading: 'Carregando contatos do WhatsApp...',
    contacts_open_wa: 'Abra o WhatsApp Web para ver os contatos',
    contacts_used: 'Plano grátis:',
    contacts_upgrade: 'Fazer upgrade para Pro',
    quick_switch: '⇄ Troca rápida',
    history_btn: '📋 Histórico',
    select_contact: 'Selecionar contato...',
    register_now: 'Registrar →',
    save_number: 'Salvar número',
    settings_appearance: 'Aparência',
    settings_theme: 'Tema',
    settings_theme_desc: 'Escolha seu esquema de cores preferido',
    settings_preview: 'Pré-visualização',
    settings_test: 'Teste sua configuração',
    settings_test_desc: 'Visualize como os contatos verão suas fotos',
    settings_tutorial: 'Tutorial',
    settings_replay: 'Repetir integração',
    settings_replay_desc: 'Assistir ao tutorial de configuração novamente',
    settings_replay_btn: 'Repetir',
    settings_data: 'Dados',
    settings_clear: 'Apagar todos os dados',
    settings_preview_btn: 'Pré-visualizar',
    copied_btn: 'Copiado!',
    switching: '⇄ Trocando…',
    switched: '✓ Trocado!',
    no_contacts_wa: 'Nenhum contato encontrado. Certifique-se de que o WhatsApp Web está carregado.',
    contacts_load_err: 'Não foi possível carregar os contatos. Tente atualizar o WhatsApp Web.',
    activating_preview: 'Ativando pré-visualização...',
    open_wa_first: 'Abra o WhatsApp Web primeiro para usar a pré-visualização.',
    preview_failed: 'Pré-visualização falhou.',
    no_wa_connect: 'Não foi possível conectar ao WhatsApp Web.',
    confirm_clear: 'Apagar todos os dados? Essa ação não pode ser desfeita.',
    number_mismatch: 'Seu número registrado não corresponde à conta do WhatsApp aberta.',
    update_number: 'Atualizar número',
    how_to_refresh: 'Como atualizar',
    refresh_instructions: 'Pressione F5 (ou Cmd+R no Mac) na aba do WhatsApp Web, depois reabra este popup.',
    waiting_refresh: 'Aguardando atualização…',
    wa_active: '✓ Ativo',
    wa_open_first: 'Abra o WhatsApp Web primeiro',
    reddit_meta1: 'r/whatsapp · há 9 anos',
    reddit_q1: '"Há alguma forma de exibir fotos de perfil diferentes para pessoas diferentes?"',
    reddit_a1: 'Resposta principal: Não.',
    reddit_meta2: 'r/whatsapp · há 5 anos',
    reddit_q2: '"Foto de perfil diferente entre web e app — é possível?"',
    reddit_a2: 'Resposta principal: Só com dois números.',
    reddit_meta3: 'r/whatsapp · há 8 meses',
    reddit_q3: '"O WhatsApp deveria suportar várias fotos de perfil."',
    reddit_a3: 'Resposta principal: [excluído]',
    tagline: 'Fotos diferentes para pessoas diferentes',
    help_btn: 'Ajuda',
    upgrade_title: 'Faça upgrade para DualProfile Pro',
    upgrade_limit_msg: 'Você atingiu o limite gratuito (2 contatos).',
    upgrade_monthly: 'Mensal — £9.99/mês',
    upgrade_annual: 'Anual — £59/ano',
    tag_annual: 'Anual',
    tag_lifetime: 'Lifetime',
    upgrade_lifetime: 'Vitalício — £79 único',
    upgrade_payment_note: 'Pagamento seguro via Lemon Squeezy.',
    upgrade_license_label: 'Já comprou? Insira sua chave de licença:',
    upgrade_activate: 'Ativar',
    upgrade_validating: 'Validando licença...',
    upgrade_license_err: 'Por favor insira sua chave de licença',
    upgrade_close: 'Fechar',
    upgrade_coming_soon_badge: '🚀 Em breve!',
    upgrade_coming_soon_msg: 'Os recursos Pro estarão disponíveis após o lançamento na Chrome Web Store.',
    upgrade_email_placeholder: 'Insira seu email para acesso antecipado',
    upgrade_notify_btn: 'Notifique-me',
    upgrade_signup_note: 'Seja o primeiro a saber quando o Pro for lançado!',
    upgrade_on_list: 'Você está na lista!',
    upgrade_already_on_list: 'Você já está na lista!',
    upgrade_email_confirm: 'Enviaremos um email para:',
    upgrade_launch_note: 'quando os recursos Pro forem lançados.',
    upgrade_notify_note: 'Avisaremos quando o Pro for lançado.',
    lets_go: 'Vamos lá',
    pro_features_title: 'Planos e recursos',
    pro_unlimited_title: 'Contatos ilimitados',
    pro_unlimited_desc: 'Atribua a quantos contatos quiser',
    pro_quickswitch_title: 'Troca rápida',
    pro_quickswitch_desc: 'Inverta todos P1 ⇄ P2 com um toque',
    pro_history_title: 'Histórico de atribuições',
    pro_history_desc: 'Registro completo de cada alteração',
    pro_support_title: 'Suporte prioritário',
    pro_support_desc: 'Acesso direto à equipe por email',
    pro_workmode_title: 'Modo trabalho / pessoal',
    pro_workmode_desc: 'Em breve',
    pro_photohistory_title: 'Histórico de fotos e reversão',
    pro_photohistory_desc: 'Restaure qualquer uma das suas últimas 3 fotos',
    feat_bulk_title: 'Atribuição em massa de contatos',
    pro_schedule_title: 'Fotos agendadas',
    pro_schedule_desc: 'Troca automática de fotos por dia e hora',
    pro_export_title: 'Exportar e importar atribuições',
    pro_export_desc: 'Faça backup e restaure todas as suas atribuições',
    pro_multidevice_title: 'Sincronização multidispositivo',
    pro_multidevice_desc: 'Suas preferências sincronizam em todos os dispositivos',
    history_panel_title: 'Histórico de fotos',
    history_slot1: 'Histórico foto 1', history_slot2: 'Histórico foto 2',
    history_restore_btn: 'Restaurar',
    history_empty: 'Sem histórico ainda — fotos anteriores aparecerão aqui',
    history_restored_toast: 'Foto restaurada com sucesso',
    history_pro_gate: 'O histórico de fotos é um recurso Pro',
    schedule_panel_title: 'Fotos agendadas',
    schedule_enable_label: 'Ativar agendamento',
    schedule_photo_label: 'Foto ativa durante a janela',
    schedule_days_label: 'Dias ativos',
    schedule_start_label: 'Hora de início', schedule_end_label: 'Hora de fim',
    schedule_save_btn: 'Salvar agendamento', schedule_saved_toast: 'Agendamento salvo',
    schedule_pro_gate: 'Fotos agendadas é um recurso Anual',
    schedule_day_sun: 'Dom', schedule_day_mon: 'Seg', schedule_day_tue: 'Ter',
    schedule_day_wed: 'Qua', schedule_day_thu: 'Qui', schedule_day_fri: 'Sex', schedule_day_sat: 'Sáb',
    schedule_active_badge: 'Agendamento ativo',
    export_btn: 'Exportar atribuições', import_btn: 'Importar atribuições',
    export_success_toast: 'Atribuições exportadas', import_success_toast: 'Atribuições importadas',
    import_error_toast: 'Arquivo inválido', export_pro_gate: 'Exportar/importar é um recurso Lifetime',
    unlock_pro: 'Ver planos — a partir de £9.99/mês',
    unlock_annual: 'Desbloquear Anual — £59/ano · Atribuição em massa',
    bulk_mode_label: 'Seleção em massa',
    bulk_assigned_p1: 'Atribuído à Foto 1',
    bulk_assigned_p2: 'Atribuído à Foto 2',
    bulk_teaser: 'Selecione todos os seus contatos de trabalho de uma vez. Plano anual.',
    coming_soon: 'Em breve',
    history_contacts_flipped: 'contatos invertidos',
    history_removed: 'removido',
    help_title: 'Como usar DualProfile',
    help_li1: 'Envie 2 fotos de perfil diferentes',
    help_li2: 'Vá para a aba Contatos e atribua contatos a cada foto',
    help_li3: 'Contatos da Foto 1 verão a Foto 1',
    help_li4: 'Contatos da Foto 2 verão a Foto 2',
    help_li5: 'Use Pré-visualização ao vivo para testar!',
    help_free_title: 'Plano gratuito',
    help_free_desc: 'Você pode atribuir até 2 contatos gratuitamente. Faça upgrade para Pro para contatos ilimitados.',
    help_trouble_title: 'Solução de problemas',
    help_trouble_desc: 'Se os contatos não carregarem, certifique-se de que o WhatsApp Web está aberto. Tente rolar a lista de chats primeiro.',
    preview_setup_title: 'Pré-visualização da sua configuração',
    preview_setup_desc: 'Assim seus contatos verão suas fotos:',
    preview_no_photo_label: 'Sem foto',
    preview_close: 'Fechar',
    waiting_for_install: 'Aguardando',
    to_install: 'instalar…',
    p2p_sync_active: 'Sincronização P2P ativa',
    sync_inactive: 'Inativo',
    sync_not_configured: 'Não configurado — defina Convex/Cloudinary em config.js',
    enter_phone_for_sync: 'Insira seu número para ativar a sincronização P2P',
    number_saved: '✓ Número salvo! A sincronização P2P está ativa.',
    change: 'Alterar',
    wa_is_active: 'DualProfile está ativo',
    sync_is_live: 'A sincronização está ativa. Você pode atribuir fotos aos contatos.',
    no_photo_assignment: 'Sem foto para esta atribuição.',
    no_history_found: 'Nenhum histórico encontrado.',
    one_more_step: 'Mais um passo',
    hard_refresh_msg: 'Recarregue o WhatsApp Web agora para ativar o DualProfile. Pressione Ctrl+Shift+R (Mac: Cmd+Shift+R) na aba do WhatsApp.',
    upgrade_working_title: 'Eles podem ver você. 🎉',
    upgrade_working_sub: 'Seu primeiro contato atribuído agora vê exatamente a foto que você escolheu. Quer que todos os seus contatos vejam a versão certa de você?',
    upgrade_working_cta: 'Desbloquear todos os contatos',
    upgrade_limit_msg_1: 'Plano grátis: 1 contato incluído.',
        trial_setup_mode: 'Configurando',
    trial_setup_desc: 'Prepare tudo — seu teste começa quando seu primeiro contato sincronizar.',
    trial_active_badge: '{days} dias restantes',
    trial_active_badge_1: 'Último dia',
    trial_started_title: 'Seu teste começou.',
    existing_user_trial_title: '🎁 Novos recursos premium adicionados.',
    existing_user_trial_desc: 'Aproveite acesso completo grátis por 3 dias.',
    trial_started_desc: '3 dias de acesso completo. Avisaremos quando o tempo estiver acabando.',
    trial_expiring_title: 'O teste termina amanhã',
    trial_expiring_desc: 'Depois de hoje, 1 contato permanecerá ativo. O resto será congelado — não excluído.',
    trial_expired_badge: 'Teste encerrado',
    trial_expired_title: 'Seu teste terminou.',
    trial_expired_desc: 'Você está no plano grátis. 1 contato permanece ativo. O resto está congelado.',
    trial_locked_contact: 'Congelado — faça upgrade para reativar',
    trial_active_contact: 'Ativo no plano grátis',
    trial_upgrade_to_unlock: 'Faça upgrade para desbloquear os {count} contatos',
    trial_upgrade_title: 'Desbloqueie tudo que você construiu.',
    trial_upgrade_sub: '{count} contatos estão congelados. Vá para o Pro para reativá-los todos instantaneamente.',
    trial_upgrade_cta: 'Reativar todos os contatos',
    trial_days_remaining: '{days} dias restantes',
    trial_hours_remaining: '{hours} horas restantes',
    trial_expires_today: 'O teste expira hoje',
    trial_label: 'Teste gratuito',
    trial_full_access: 'Acesso completo',
    trial_not_started: 'Teste não iniciado',
        phone_registered_placeholder: 'Telefone registrado',
        settings_phone_label: 'Seu número do WhatsApp',
    settings_phone_helper: 'Necessário para sincronização de foto P2P. Armazenado apenas como hash.',
    settings_phone_label: 'Seu número do WhatsApp',
    settings_phone_helper: 'Necessário para sincronização de foto P2P. Armazenado apenas como hash.',
        settings_phone_label: 'Seu número do WhatsApp',
    settings_phone_helper: 'Necessário para sincronização de foto P2P. Armazenado apenas como hash.',
        refresh_prompt_waiting: 'Aguardando...',
  },
  de: {
    lang_label: 'Sprache',
    headline: 'Du sprichst schon anders, je nachdem, wer zuhört.',
    headline_bridge: 'Dein Foto nicht. Menschen wünschen sich das seit Jahren:',
    now_exists: 'Jetzt gibt es es.',
    sub: 'Weise verschiedenen Kontakten verschiedene Fotos zu — dein Chef sieht eines, deine Freunde ein anderes. Automatisch gewechselt. Gleiche Nummer, gleiches WhatsApp.',
    free_to_start: 'Kostenlos starten',
    works_on_web: 'Funktioniert auf WhatsApp Web',
    two_minutes: '2 Minuten Einrichtung',
    show_me: 'Zeig mir wie',
    pair_title: 'DualProfile funktioniert zwischen zwei Personen.',
    pair_sub: 'Wenn du jemandem ein Foto zuweist, braucht diese Person auch DualProfile. Sende jetzt den Link, bevor du die Einrichtung abschließt.',
    copy_link: '📎 Installations-Link kopieren',
    copied_msg: 'Kopiert — füge es in WhatsApp ein und mache weiter',
    p2p_reminder_msg: '{name} sieht das Foto erst, wenn er oder sie DualProfile auch installiert hat.',
    continue_setup: 'Einrichtung fortsetzen',
    invite_later: 'Ich lade später ein',
    upload_title: 'Lade deine zwei Fotos hoch.',
    upload_sub: 'Eines für die Arbeit. Eines für alles andere.',
    phone_title: 'Gib deine WhatsApp-Nummer ein.',
    phone_sub: 'Das verknüpft deine Fotos mit deiner WhatsApp-Identität.',
    refresh_title: 'Aktualisiere WhatsApp Web.',
    refresh_sub: 'Das aktiviert DualProfile in WhatsApp.',
    assign_title: 'Weise Kontakten Fotos zu.',
    assign_sub: 'Weise jedem Kontakt Foto 1 oder Foto 2 zu.',
    live_title: 'Du bist live.',
    live_sub: 'Sobald dein Kontakt installiert und registriert, erscheint dein zugewiesenes Foto automatisch auf seinem Bildschirm.',
    open_wa: 'WhatsApp Web öffnen',
    copy_share: 'Installations-Link kopieren',
    copy_share_confirm: 'Kopiert — füge es deinem Kontakt in WhatsApp ein',
    step_badge_1of3: 'Schritt 1 von 3',
    upload_title2: 'Lade deine zwei Fotos hoch',
    upload_sub2: 'Eines für die Arbeit. Eines für das Leben. Du entscheidest, wer was sieht.',
    upload_note: 'Du brauchst nur ein Foto, um fortzufahren — füge das zweite später hinzu.',
    upload_photo1_label: 'Foto 1',
    upload_photo2_label: 'Foto 2',
    upload_tap: 'Tippen zum Hochladen',
    upload_hint1: 'z.B. professionell, Arbeitsfoto',
    upload_hint2: 'z.B. persönlich, lässig, du selbst',
    upload_error: 'Lade mindestens ein Foto hoch, um fortzufahren.',
    upload_too_large: 'Dieses Bild ist zu groß. Verwende eines unter 5 MB.',
    upload_continue: 'Weiter',
    step_badge_2of3: 'Schritt 2 von 3',
    phone_title2: 'Registriere deine WhatsApp-Nummer',
    phone_sub2: 'So erkennen andere DualProfile-Nutzer dich — und so erreicht dein zugewiesenes Foto automatisch ihren Bildschirm.',
    phone_note: 'Gib deinen Ländervorwahl ein. Deine Nummer wird nicht direkt gespeichert — sie wird sofort in einen privaten, sicheren Code umgewandelt.',
    phone_error: 'Bitte gib eine gültige Nummer mit Ländervorwahl ein.',
    phone_save: 'Speichern und weiter',
    phone_skip: 'Ich mache das später',
    phone_saving: 'Wird gespeichert...',
    phone_warn_title: 'Bevor du überspringst — das verlierst du',
    phone_warn_li1: 'Andere DualProfile-Nutzer wissen nicht, dass du die Erweiterung hast — sie sehen eine Einladen-Schaltfläche statt deines Profils.',
    phone_warn_li2: 'Deine zugewiesenen Fotos werden nicht in Echtzeit synchronisiert.',
    phone_warn_li3: 'Ohne deine Nummer funktioniert DualProfile für dich nur halb.',
    phone_warn_register: 'Meine Nummer registrieren',
    phone_warn_skip: 'Jetzt überspringen',
    refresh_title2: 'Aktualisiere deinen WhatsApp Web-Tab',
    refresh_sub2: 'Das aktiviert DualProfile in WhatsApp und lässt es deine Kontakte erkennen.',
    refresh_step1: 'Wechsle zu deinem WhatsApp Web-Tab',
    refresh_step2: 'Drücke F5 oder Strg+R · Mac: Cmd+R',
    refresh_step3: 'Komm hierher zurück und tippe auf Weiter',
    refresh_done: 'Fertig — weiter',
    refresh_not_open: 'WhatsApp ist gerade nicht geöffnet',
    step_badge_3of3: 'Schritt 3 von 3',
    assign_title2: 'Wer sieht welches Foto?',
    assign_sub2: 'Weise jedem Kontakt Foto 1 oder Foto 2 zu. Du kannst das jederzeit im Tab Kontakte ändern.',
    assign_scroll_title: 'Eine Sache bevor wir deine Kontakte laden',
    assign_scroll_sub: 'Wechsle zu deinem WhatsApp Web-Tab und scrolle durch deine Chats — das stellt sicher, dass alle deine Kontakte geladen sind.',
    assign_load_btn: 'Fertig — meine Kontakte laden',
    assign_photo1_legend: 'Dein erstes Foto',
    assign_photo2_legend: 'Dein zweites Foto',
    assign_loading: 'Kontakte aus WhatsApp werden geladen...',
    assign_no_contacts: 'Keine Kontakte gefunden. Geh zu WhatsApp Web, scrolle durch deine Chats, dann tippe auf Wiederholen.',
    assign_retry: 'Wiederholen',
    assign_finish: 'Einrichtung abschließen',
    assign_skip: 'Ich weise Kontakte später zu',
    assign_free_limit: 'Kostenloser Plan: bis zu',
    assign_free_contacts: 'Kontakten.',
    assign_upgrade: 'Auf Pro upgraden →',
    live_badge_active: '● LIVE',
    live_badge_almost: '⚠ Fast fertig',
    live_title_full: 'Von nun an sieht jeder genau das, was du willst, dass er sieht.',
    live_title_almost: 'Fast fertig — noch ein Schritt.',
    live_will_see_p1: 'Wird dein Foto 1 sehen ✓',
    live_will_see_p2: 'Wird dein Foto 2 sehen ✓',
    live_no_assign: 'Deine Fotos sind bereit. Weise jederzeit Kontakte im Tab Kontakte zu.',
    live_check_photos: 'Fotos hochgeladen',
    live_check_registered: 'Im DualProfile-Netzwerk aktiv',
    live_check_not_registered: 'Nummer nicht registriert —',
    live_fix_this: 'jetzt beheben →',
    live_warn_detail: 'Ohne deine Nummer sehen Kontakte einen Einladen-Button statt deines Fotos und die Echtzeit-Synchronisierung funktioniert nicht.',
    live_fully_active: 'DualProfile vollständig aktiv',
    live_partly_active: 'DualProfile teilweise aktiv',
    live_nudge: 'Mehr als 2 Kontakte nötig?',
    live_upgrade: 'Auf Pro upgraden →',
    live_network_title: 'Wichtig — so funktioniert DualProfile',
    live_network_body: 'Damit ein Kontakt dein zugewiesenes Foto sieht, muss er ebenfalls DualProfile installiert haben. Sobald er es hat, erscheint dein Foto automatisch auf seinem Bildschirm — ohne weitere Schritte.',
    live_copy_link: 'Installations-Link kopieren',
    live_copied: 'Kopiert — füge es deinem Kontakt in WhatsApp ein',
    live_continue: 'Weiter',
    tab_preview: 'Vorschau',
    tab_photos: 'Fotos',
    tab_contacts: 'Kontakte',
    tab_settings: 'Einstellungen',
    status_active: 'Erweiterung aktiv',
    status_disabled: 'Erweiterung deaktiviert',
    preview_hero_title: 'Live-Simulation',
    preview_hero_sub: 'Sieh genau, wie verschiedene Personen dich auf WhatsApp sehen',
    preview_label: 'Vorschau als:',
    preview_select: 'Kontakt auswählen...',
    preview_hint: 'Dein WhatsApp-Profilfoto aktualisiert sich live beim Kontaktwechsel',
    preview_exit_btn: 'Vorschau beenden',
    preview_no_photo: 'Lade zuerst Fotos hoch, dann wähle oben einen Kontakt aus',
    preview_go_photos: 'Fotos hochladen →',
    invite_choose_style: 'Wähle deinen Stil:',
    invite_copy_btn: 'Nachricht kopieren',
    invite_wa_btn: 'Per WhatsApp senden →',
    photo_click_upload: 'Zum Hochladen klicken',
    photo1_label: 'Foto 1',
    photo2_label: 'Foto 2',
    photo_default_label: 'Standardfoto für nicht aufgelistete Kontakte:',
    photo_live_preview: 'Live-Vorschau',
    photo_preview_desc: 'Sieh, wie sich dein Profilfoto in WhatsApp Web ändert:',
    photo_preview_select: 'Kontakt auswählen...',
    photo_preview_as: 'Vorschau als:',
    exit_preview_mode: 'Vorschaumodus beenden',
    contacts_loading: 'Kontakte aus WhatsApp werden geladen...',
    contacts_open_wa: 'Öffne WhatsApp Web, um Kontakte zu sehen',
    contacts_used: 'Kostenloser Plan:',
    contacts_upgrade: 'Auf Pro upgraden',
    quick_switch: '⇄ Schnellwechsel',
    history_btn: '📋 Verlauf',
    select_contact: 'Kontakt auswählen...',
    register_now: 'Jetzt registrieren →',
    save_number: 'Nummer speichern',
    settings_appearance: 'Erscheinungsbild',
    settings_theme: 'Design',
    settings_theme_desc: 'Wähle dein bevorzugtes Farbschema',
    settings_preview: 'Vorschau',
    settings_test: 'Dein Setup testen',
    settings_test_desc: 'Vorschau, wie Kontakte deine Fotos sehen werden',
    settings_tutorial: 'Tutorial',
    settings_replay: 'Einführung wiederholen',
    settings_replay_desc: 'Setup-Tutorial erneut ansehen',
    settings_replay_btn: 'Wiederholen',
    settings_data: 'Daten',
    settings_clear: 'Alle Daten löschen',
    settings_preview_btn: 'Vorschau',
    copied_btn: 'Kopiert!',
    switching: '⇄ Wechselt…',
    switched: '✓ Gewechselt!',
    no_contacts_wa: 'Keine Kontakte gefunden. Stelle sicher, dass WhatsApp Web geladen ist.',
    contacts_load_err: 'Kontakte konnten nicht geladen werden. Versuche, WhatsApp Web zu aktualisieren.',
    activating_preview: 'Vorschau wird aktiviert...',
    open_wa_first: 'Öffne zuerst WhatsApp Web, um die Vorschau zu nutzen.',
    preview_failed: 'Vorschau fehlgeschlagen.',
    no_wa_connect: 'Verbindung zu WhatsApp Web nicht möglich.',
    confirm_clear: 'Alle Daten löschen? Dies kann nicht rückgängig gemacht werden.',
    number_mismatch: 'Deine registrierte Nummer stimmt nicht mit dem aktuell geöffneten WhatsApp-Konto überein.',
    update_number: 'Nummer aktualisieren',
    how_to_refresh: 'So aktualisierst du',
    refresh_instructions: 'Drücke F5 (oder Cmd+R auf dem Mac) in deinem WhatsApp Web-Tab, dann öffne dieses Popup erneut.',
    waiting_refresh: 'Warte auf Aktualisierung…',
    wa_active: '✓ Aktiv',
    wa_open_first: 'Öffne zuerst WhatsApp Web',
    reddit_meta1: 'r/whatsapp · vor 9 Jahren',
    reddit_q1: '"Gibt es eine Möglichkeit, verschiedenen Personen unterschiedliche Profilfotos anzuzeigen?"',
    reddit_a1: 'Top-Antwort: Nein.',
    reddit_meta2: 'r/whatsapp · vor 5 Jahren',
    reddit_q2: '"Unterschiedliches Profilfoto in Web und App — ist das möglich?"',
    reddit_a2: 'Top-Antwort: Nur mit zwei Nummern.',
    reddit_meta3: 'r/whatsapp · vor 8 Monaten',
    reddit_q3: '"WhatsApp sollte mehrere Profilfotos unterstützen."',
    reddit_a3: 'Top-Antwort: [gelöscht]',
    tagline: 'Verschiedene Fotos für verschiedene Menschen',
    help_btn: 'Hilfe',
    upgrade_title: 'Auf DualProfile Pro upgraden',
    upgrade_limit_msg: 'Du hast das kostenlose Limit erreicht (2 Kontakte).',
    upgrade_monthly: 'Monatlich — £9,99/Monat',
    upgrade_annual: 'Jährlich — £59/Jahr',
    tag_annual: 'Jährlich',
    tag_lifetime: 'Lifetime',
    upgrade_lifetime: 'Lifetime — £79 einmalig',
    upgrade_payment_note: 'Sichere Zahlung via Lemon Squeezy.',
    upgrade_license_label: 'Bereits gekauft? Gib deinen Lizenzschlüssel ein:',
    upgrade_activate: 'Aktivieren',
    upgrade_validating: 'Lizenz wird überprüft...',
    upgrade_license_err: 'Bitte gib deinen Lizenzschlüssel ein',
    upgrade_close: 'Schließen',
    upgrade_coming_soon_badge: '🚀 Demnächst!',
    upgrade_coming_soon_msg: 'Pro-Funktionen werden nach dem Launch im Chrome Web Store verfügbar sein.',
    upgrade_email_placeholder: 'E-Mail für Frühzugang eingeben',
    upgrade_notify_btn: 'Benachrichtige mich',
    upgrade_signup_note: 'Sei der Erste, der weiß, wann Pro startet!',
    upgrade_on_list: 'Du bist auf der Liste!',
    upgrade_already_on_list: 'Du bist bereits auf der Liste!',
    upgrade_email_confirm: 'Wir schicken dir eine E-Mail an:',
    upgrade_launch_note: 'wenn die Pro-Funktionen starten.',
    upgrade_notify_note: 'Wir benachrichtigen dich, wenn Pro startet.',
    lets_go: "Los geht's",
    pro_features_title: 'Pläne & Funktionen',
    pro_unlimited_title: 'Unbegrenzte Kontakte',
    pro_unlimited_desc: 'Weise so vielen Kontakten wie du willst zu',
    pro_quickswitch_title: 'Schnellwechsel',
    pro_quickswitch_desc: 'Alle P1 ⇄ P2 mit einem Tippen wechseln',
    pro_history_title: 'Zuweisungsverlauf',
    pro_history_desc: 'Vollständiges Protokoll jeder Änderung',
    pro_support_title: 'Prioritäts-Support',
    pro_support_desc: 'Direkter E-Mail-Zugang zum Team',
    pro_workmode_title: 'Arbeits- / Privat-Modus',
    pro_workmode_desc: 'Demnächst',
    pro_photohistory_title: 'Fotoverlauf und Wiederherstellung',
    pro_photohistory_desc: 'Stelle eines deiner letzten 3 Fotos wieder her',
    feat_bulk_title: 'Massenzuweisung von Kontakten',
    pro_schedule_title: 'Geplante Fotos',
    pro_schedule_desc: 'Automatischer Fotowechsel nach Tag und Uhrzeit',
    pro_export_title: 'Zuweisungen exportieren & importieren',
    pro_export_desc: 'Sichere und stelle alle deine Zuweisungen wieder her',
    pro_multidevice_title: 'Multi-Gerät-Synchronisierung',
    pro_multidevice_desc: 'Deine Einstellungen werden auf allen Geräten synchronisiert',
    history_panel_title: 'Fotoverlauf',
    history_slot1: 'Foto 1 Verlauf', history_slot2: 'Foto 2 Verlauf',
    history_restore_btn: 'Wiederherstellen',
    history_empty: 'Noch kein Verlauf — frühere Fotos erscheinen hier',
    history_restored_toast: 'Foto erfolgreich wiederhergestellt',
    history_pro_gate: 'Fotoverlauf ist eine Pro-Funktion',
    schedule_panel_title: 'Geplante Fotos',
    schedule_enable_label: 'Zeitplan aktivieren',
    schedule_photo_label: 'Aktives Foto im Zeitfenster',
    schedule_days_label: 'Aktive Tage',
    schedule_start_label: 'Startzeit', schedule_end_label: 'Endzeit',
    schedule_save_btn: 'Zeitplan speichern', schedule_saved_toast: 'Zeitplan gespeichert',
    schedule_pro_gate: 'Geplante Fotos sind eine Jahresplan-Funktion',
    schedule_day_sun: 'So', schedule_day_mon: 'Mo', schedule_day_tue: 'Di',
    schedule_day_wed: 'Mi', schedule_day_thu: 'Do', schedule_day_fri: 'Fr', schedule_day_sat: 'Sa',
    schedule_active_badge: 'Zeitplan aktiv',
    export_btn: 'Zuweisungen exportieren', import_btn: 'Zuweisungen importieren',
    export_success_toast: 'Zuweisungen exportiert', import_success_toast: 'Zuweisungen importiert',
    import_error_toast: 'Ungültige Datei', export_pro_gate: 'Export/Import ist eine Lifetime-Funktion',
    unlock_pro: 'Pläne ansehen — ab £9.99/Monat',
    unlock_annual: 'Jährlich freischalten — £59/Jahr · Massenzuweisung',
    bulk_mode_label: 'Massenauswahl',
    bulk_assigned_p1: 'Foto 1 zugewiesen',
    bulk_assigned_p2: 'Foto 2 zugewiesen',
    bulk_teaser: 'Alle Arbeitskontakte auf einmal auswählen. Jahresplan.',
    coming_soon: 'Demnächst',
    history_contacts_flipped: 'Kontakte gewechselt',
    history_removed: 'entfernt',
    help_title: 'So verwendest du DualProfile',
    help_li1: '2 verschiedene Profilfotos hochladen',
    help_li2: 'Im Kontakte-Tab Kontakte jedem Foto zuweisen',
    help_li3: 'Kontakte von Foto 1 sehen Foto 1',
    help_li4: 'Kontakte von Foto 2 sehen Foto 2',
    help_li5: 'Live-Vorschau nutzen, um es zu testen!',
    help_free_title: 'Kostenloser Plan',
    help_free_desc: 'Du kannst kostenlos bis zu 2 Kontakte zuweisen. Upgrade auf Pro für unbegrenzte Kontakte.',
    help_trouble_title: 'Fehlerbehebung',
    help_trouble_desc: 'Wenn Kontakte nicht laden, stelle sicher, dass WhatsApp Web geöffnet ist. Scrolle zuerst in deiner Chat-Liste.',
    preview_setup_title: 'Vorschau deiner Einrichtung',
    preview_setup_desc: 'So sehen deine Kontakte deine Fotos:',
    preview_no_photo_label: 'Kein Foto',
    preview_close: 'Schließen',
    waiting_for_install: 'Warte auf',
    to_install: 'Installation…',
    p2p_sync_active: 'P2P-Synchronisierung aktiv',
    sync_inactive: 'Inaktiv',
    sync_not_configured: 'Nicht konfiguriert — setze Convex/Cloudinary in config.js',
    enter_phone_for_sync: 'Nummer eingeben, um P2P-Sync zu aktivieren',
    number_saved: '✓ Nummer gespeichert! P2P-Sync ist jetzt aktiv.',
    change: 'Ändern',
    wa_is_active: 'DualProfile ist aktiv',
    sync_is_live: 'Sync ist aktiv. Du kannst jetzt Kontakten Fotos zuweisen.',
    no_photo_assignment: 'Kein Foto für diese Zuweisung hochgeladen.',
    no_history_found: 'Kein Verlauf gefunden.',
    one_more_step: 'Noch ein Schritt',
    hard_refresh_msg: 'Führe jetzt einen Hard-Refresh von WhatsApp Web durch, um DualProfile zu aktivieren. Drücke Ctrl+Shift+R (Mac: Cmd+Shift+R) in deinem WhatsApp-Tab.',
    upgrade_working_title: 'Sie sehen dich. 🎉',
    upgrade_working_sub: 'Dein erster zugewiesener Kontakt sieht genau das Foto, das du für ihn gewählt hast. Möchtest du, dass alle deine Kontakte die richtige Version von dir sehen?',
    upgrade_working_cta: 'Alle Kontakte freischalten',
    upgrade_limit_msg_1: 'Kostenloser Plan: 1 Kontakt inklusive.',
        trial_setup_mode: 'Einrichten',
    trial_setup_desc: 'Bereite alles vor — dein Test beginnt, wenn dein erster Kontakt synchronisiert wird.',
    trial_active_badge: 'Noch {days} Tage',
    trial_active_badge_1: 'Letzter Tag',
    trial_started_title: 'Dein Test hat begonnen.',
    existing_user_trial_title: '🎁 Neue Premium-Funktionen hinzugefügt.',
    existing_user_trial_desc: '3 Tage lang kostenlos vollen Zugriff genießen.',
    trial_started_desc: '3 Tage Vollzugang. Wir benachrichtigen dich, wenn die Zeit bald abläuft.',
    trial_expiring_title: 'Test endet morgen',
    trial_expiring_desc: 'Ab morgen bleibt 1 Kontakt aktiv. Der Rest wird eingefroren — nicht gelöscht.',
    trial_expired_badge: 'Test beendet',
    trial_expired_title: 'Dein Test ist beendet.',
    trial_expired_desc: 'Du bist im kostenlosen Plan. 1 Kontakt bleibt aktiv. Der Rest ist eingefroren.',
    trial_locked_contact: 'Eingefroren — upgrade zum Reaktivieren',
    trial_active_contact: 'Aktiv im kostenlosen Plan',
    trial_upgrade_to_unlock: 'Upgrade, um alle {count} Kontakte freizuschalten',
    trial_upgrade_title: 'Schalte alles frei, was du aufgebaut hast.',
    trial_upgrade_sub: '{count} Kontakte sind eingefroren. Wechsle zu Pro, um sie alle sofort zu reaktivieren.',
    trial_upgrade_cta: 'Alle Kontakte reaktivieren',
    trial_days_remaining: 'Noch {days} Tage',
    trial_hours_remaining: 'Noch {hours} Stunden',
    trial_expires_today: 'Test läuft heute ab',
    trial_label: 'Kostenlose Testversion',
    trial_full_access: 'Vollzugang',
    trial_not_started: 'Test nicht gestartet',
        phone_registered_placeholder: 'Nummer gespeichert',
        settings_phone_label: 'Deine WhatsApp-Nummer',
    settings_phone_helper: 'Erforderlich für P2P-Fotosynchronisierung. Wird nur als Hash gespeichert.',
    settings_phone_label: 'Deine WhatsApp-Nummer',
    settings_phone_helper: 'Erforderlich für P2P-Fotosynchronisierung. Wird nur als Hash gespeichert.',
        settings_phone_label: 'Deine WhatsApp-Nummer',
    settings_phone_helper: 'Erforderlich für P2P-Fotosynchronisierung. Wird nur als Hash gespeichert.',
        refresh_prompt_waiting: 'Warten...',
  },
  hi: {
    lang_label: 'भाषा',
    headline: 'आप पहले से ही सुनने वाले के हिसाब से बात करने का तरीका बदलते हैं।',
    headline_bridge: 'आपकी फोटो नहीं बदलती। पता चला कि लोग सालों से यही माँग रहे थे:',
    now_exists: 'अब यह मौजूद है।',
    sub: 'अलग-अलग कॉन्टैक्ट को अलग-अलग फोटो असाइन करें — आपका बॉस एक देखे, दोस्त दूसरी। अपने आप बदलते हुए। एक ही नंबर, वही WhatsApp।',
    free_to_start: 'मुफ़्त में शुरू करें',
    works_on_web: 'WhatsApp Web पर काम करता है',
    two_minutes: '2 मिनट में सेटअप',
    show_me: 'मुझे दिखाएं',
    pair_title: 'DualProfile दो लोगों के बीच काम करता है।',
    pair_sub: 'जब आप किसी को फ़ोटो असाइन करते हैं, तो उन्हें भी DualProfile चाहिए। सेटअप पूरा करने से पहले अभी लिंक भेजें।',
    copy_link: '📎 इंस्टॉल लिंक कॉपी करें',
    copied_msg: 'कॉपी हो गया — WhatsApp में पेस्ट करें और आगे बढ़ें',
    p2p_reminder_msg: '{name} इसे तभी देख पाएंगे जब वे भी DualProfile इंस्टॉल करेंगे।',
    continue_setup: 'सेटअप जारी रखें',
    invite_later: 'बाद में आमंत्रित करूँगा',
    upload_title: 'अपनी दो फ़ोटो अपलोड करें।',
    upload_sub: 'एक काम के लिए। एक बाकी सबके लिए।',
    phone_title: 'अपना WhatsApp नंबर दर्ज करें।',
    phone_sub: 'यह आपकी फ़ोटो को आपकी WhatsApp पहचान से जोड़ता है।',
    refresh_title: 'WhatsApp Web रीफ़्रेश करें।',
    refresh_sub: 'यह WhatsApp के अंदर DualProfile को सक्रिय करता है।',
    assign_title: 'संपर्कों को फ़ोटो असाइन करें।',
    assign_sub: 'हर संपर्क को फ़ोटो 1 या फ़ोटो 2 असाइन करें।',
    live_title: 'आप लाइव हैं।',
    live_sub: 'जैसे ही आपका संपर्क इंस्टॉल और रजिस्टर करे, आपकी असाइन की गई फ़ोटो उनकी स्क्रीन पर अपने आप दिखेगी।',
    open_wa: 'WhatsApp Web खोलें',
    copy_share: 'शेयर करने के लिए लिंक कॉपी करें',
    copy_share_confirm: 'कॉपी हो गया — अपने संपर्क को WhatsApp पर भेजें',
    step_badge_1of3: 'चरण 1 / 3',
    upload_title2: 'अपनी दो फ़ोटो अपलोड करें',
    upload_sub2: 'एक काम के लिए। एक ज़िंदगी के लिए। आप तय करें कौन क्या देखे।',
    upload_note: 'जारी रखने के लिए केवल एक फ़ोटो चाहिए — दूसरी बाद में जोड़ें।',
    upload_photo1_label: 'फ़ोटो 1',
    upload_photo2_label: 'फ़ोटो 2',
    upload_tap: 'अपलोड करने के लिए टैप करें',
    upload_hint1: 'जैसे: पेशेवर, वर्क फ़ोटो',
    upload_hint2: 'जैसे: व्यक्तिगत, कैज़ुअल, असली आप',
    upload_error: 'जारी रखने के लिए कम से कम एक फ़ोटो अपलोड करें।',
    upload_too_large: 'यह इमेज बहुत बड़ी है। 5MB से छोटी इमेज का उपयोग करें।',
    upload_continue: 'जारी रखें',
    step_badge_2of3: 'चरण 2 / 3',
    phone_title2: 'अपना WhatsApp नंबर रजिस्टर करें',
    phone_sub2: 'इससे अन्य DualProfile उपयोगकर्ता आपको पहचानते हैं — और आपकी असाइन की गई फ़ोटो अपने आप उनकी स्क्रीन पर पहुँचती है।',
    phone_note: 'अपना देश कोड शामिल करें। आपका नंबर सीधे संग्रहीत नहीं होता — यह तुरंत एक निजी सुरक्षित कोड में बदल जाता है।',
    phone_error: 'कृपया देश कोड के साथ एक वैध नंबर दर्ज करें।',
    phone_save: 'सहेजें और जारी रखें',
    phone_skip: 'बाद में करूँगा',
    phone_saving: 'सहेजा जा रहा है...',
    phone_warn_title: 'छोड़ने से पहले — आप ये खो देंगे',
    phone_warn_li1: 'अन्य DualProfile उपयोगकर्ताओं को पता नहीं चलेगा कि आपके पास एक्सटेंशन है — वे आपके प्रोफ़ाइल की जगह आमंत्रित बटन देखेंगे।',
    phone_warn_li2: 'आपकी असाइन की गई फ़ोटो रियल-टाइम में सिंक नहीं होंगी।',
    phone_warn_li3: 'बिना नंबर के DualProfile आपके लिए आधा ही काम करता है।',
    phone_warn_register: 'मेरा नंबर रजिस्टर करें',
    phone_warn_skip: 'अभी छोड़ें',
    refresh_title2: 'अपना WhatsApp Web टैब रीफ़्रेश करें',
    refresh_sub2: 'इससे WhatsApp के अंदर DualProfile सक्रिय होता है और आपके संपर्कों को पहचान सकता है।',
    refresh_step1: 'अपने WhatsApp Web टैब पर जाएं',
    refresh_step2: 'F5 या Ctrl+R दबाएं · Mac: Cmd+R',
    refresh_step3: 'यहाँ वापस आएं और जारी रखें पर टैप करें',
    refresh_done: 'हो गया — जारी रखें',
    refresh_not_open: 'WhatsApp अभी नहीं खुला है',
    step_badge_3of3: 'चरण 3 / 3',
    assign_title2: 'कौन कौन सी फ़ोटो देखे?',
    assign_sub2: 'हर संपर्क को फ़ोटो 1 या फ़ोटो 2 असाइन करें। संपर्क टैब से कभी भी बदलें।',
    assign_scroll_title: 'संपर्क लोड करने से पहले एक काम',
    assign_scroll_sub: 'अपने WhatsApp Web टैब पर जाएं और चैट सूची को नीचे स्क्रॉल करें — इससे सभी संपर्क लोड हो जाएंगे।',
    assign_load_btn: 'हो गया — मेरे संपर्क लोड करें',
    assign_photo1_legend: 'आपकी पहली फ़ोटो',
    assign_photo2_legend: 'आपकी दूसरी फ़ोटो',
    assign_loading: 'WhatsApp से संपर्क लोड हो रहे हैं...',
    assign_no_contacts: 'कोई संपर्क नहीं मिला। WhatsApp Web पर जाएं, चैट स्क्रॉल करें, फिर पुनः प्रयास करें।',
    assign_retry: 'पुनः प्रयास',
    assign_finish: 'सेटअप पूरा करें',
    assign_skip: 'बाद में संपर्क असाइन करूँगा',
    assign_free_limit: 'मुफ़्त प्लान: अधिकतम',
    assign_free_contacts: 'संपर्क।',
    assign_upgrade: 'Pro में अपग्रेड करें →',
    live_badge_active: '● लाइव',
    live_badge_almost: '⚠ लगभग तैयार',
    live_title_full: 'अब से हर व्यक्ति बिल्कुल वही देखेगा जो आप चाहते हैं।',
    live_title_almost: 'लगभग तैयार — बस एक कदम बाकी।',
    live_will_see_p1: 'आपकी फ़ोटो 1 देखेगा ✓',
    live_will_see_p2: 'आपकी फ़ोटो 2 देखेगा ✓',
    live_no_assign: 'आपकी फ़ोटो तैयार है। संपर्क टैब से कभी भी असाइन करें।',
    live_check_photos: 'फ़ोटो अपलोड हो गई',
    live_check_registered: 'DualProfile नेटवर्क पर लाइव हैं',
    live_check_not_registered: 'नंबर रजिस्टर्ड नहीं —',
    live_fix_this: 'ठीक करें →',
    live_warn_detail: 'बिना नंबर के, संपर्क आपकी फ़ोटो की जगह आमंत्रित बटन देखते हैं और रियल-टाइम सिंक काम नहीं करता।',
    live_fully_active: 'DualProfile पूरी तरह सक्रिय',
    live_partly_active: 'DualProfile आंशिक रूप से सक्रिय',
    live_nudge: '2 से ज़्यादा संपर्क चाहिए?',
    live_upgrade: 'Pro में अपग्रेड करें →',
    live_network_title: 'ज़रूरी — DualProfile कैसे काम करता है',
    live_network_body: 'कोई संपर्क आपकी असाइन की गई फ़ोटो देखे, इसके लिए उन्हें भी DualProfile इंस्टॉल करना होगा। एक बार इंस्टॉल होते ही आपकी फ़ोटो उनकी स्क्रीन पर अपने आप दिखेगी — कोई अतिरिक्त कदम नहीं।',
    live_copy_link: 'इंस्टॉल लिंक कॉपी करें',
    live_copied: 'कॉपी हो गया — अपने संपर्क को WhatsApp पर भेजें',
    live_continue: 'जारी रखें',
    tab_preview: 'पूर्वावलोकन',
    tab_photos: 'फ़ोटो',
    tab_contacts: 'संपर्क',
    tab_settings: 'सेटिंग्स',
    status_active: 'एक्सटेंशन सक्रिय',
    status_disabled: 'एक्सटेंशन अक्षम',
    preview_hero_title: 'लाइव सिम्युलेशन',
    preview_hero_sub: 'देखें कि WhatsApp पर अलग-अलग लोग आपको कैसे देखते हैं',
    preview_label: 'इस रूप में पूर्वावलोकन:',
    preview_select: 'संपर्क चुनें...',
    preview_hint: 'संपर्क बदलने पर आपकी WhatsApp प्रोफ़ाइल फ़ोटो लाइव अपडेट होती है',
    preview_exit_btn: 'पूर्वावलोकन से बाहर निकलें',
    preview_no_photo: 'पहले फ़ोटो अपलोड करें, फिर ऊपर से संपर्क चुनें',
    preview_go_photos: 'फ़ोटो अपलोड करें →',
    invite_choose_style: 'अपनी शैली चुनें:',
    invite_copy_btn: 'संदेश कॉपी करें',
    invite_wa_btn: 'WhatsApp पर भेजें →',
    photo_click_upload: 'अपलोड करने के लिए क्लिक करें',
    photo1_label: 'फ़ोटो 1',
    photo2_label: 'फ़ोटो 2',
    photo_default_label: 'असूचीबद्ध संपर्कों के लिए डिफ़ॉल्ट फ़ोटो:',
    photo_live_preview: 'लाइव पूर्वावलोकन',
    photo_preview_desc: 'WhatsApp Web में अपनी प्रोफ़ाइल फ़ोटो बदलते देखें:',
    photo_preview_select: 'संपर्क चुनें...',
    photo_preview_as: 'इस रूप में पूर्वावलोकन:',
    exit_preview_mode: 'पूर्वावलोकन मोड से बाहर निकलें',
    contacts_loading: 'WhatsApp से संपर्क लोड हो रहे हैं...',
    contacts_open_wa: 'संपर्क देखने के लिए WhatsApp Web खोलें',
    contacts_used: 'मुफ़्त स्तर:',
    contacts_upgrade: 'Pro में अपग्रेड करें',
    quick_switch: '⇄ त्वरित स्विच',
    history_btn: '📋 इतिहास',
    select_contact: 'संपर्क चुनें...',
    register_now: 'अभी रजिस्टर करें →',
    save_number: 'नंबर सहेजें',
    settings_appearance: 'रूप',
    settings_theme: 'थीम',
    settings_theme_desc: 'अपना पसंदीदा रंग योजना चुनें',
    settings_preview: 'पूर्वावलोकन',
    settings_test: 'अपना सेटअप परीक्षण करें',
    settings_test_desc: 'देखें कि संपर्क आपकी फ़ोटो कैसे देखेंगे',
    settings_tutorial: 'ट्यूटोरियल',
    settings_replay: 'ऑनबोर्डिंग दोबारा',
    settings_replay_desc: 'सेटअप ट्यूटोरियल फिर से देखें',
    settings_replay_btn: 'दोबारा',
    settings_data: 'डेटा',
    settings_clear: 'सभी डेटा साफ़ करें',
    settings_preview_btn: 'पूर्वावलोकन',
    copied_btn: 'कॉपी हो गया!',
    switching: '⇄ स्विच हो रहा है…',
    switched: '✓ स्विच हो गया!',
    no_contacts_wa: 'कोई संपर्क नहीं मिला। सुनिश्चित करें WhatsApp Web लोड है।',
    contacts_load_err: 'संपर्क लोड नहीं हो सके। WhatsApp Web रीफ़्रेश करें।',
    activating_preview: 'पूर्वावलोकन सक्रिय हो रहा है...',
    open_wa_first: 'पूर्वावलोकन के लिए पहले WhatsApp Web खोलें।',
    preview_failed: 'पूर्वावलोकन विफल।',
    no_wa_connect: 'WhatsApp Web से कनेक्ट नहीं हो सका।',
    confirm_clear: 'सभी डेटा साफ़ करें? इसे वापस नहीं किया जा सकता।',
    number_mismatch: 'आपका रजिस्टर्ड नंबर खुले WhatsApp खाते से मेल नहीं खाता।',
    update_number: 'नंबर अपडेट करें',
    how_to_refresh: 'रीफ़्रेश कैसे करें',
    refresh_instructions: 'WhatsApp Web टैब पर F5 (Mac: Cmd+R) दबाएं, फिर popup दोबारा खोलें।',
    waiting_refresh: 'रीफ़्रेश का इंतज़ार…',
    wa_active: '✓ सक्रिय',
    wa_open_first: 'पहले WhatsApp Web खोलें',
    reddit_meta1: 'r/whatsapp · 9 साल पहले',
    reddit_q1: '"क्या अलग-अलग लोगों को अलग प्रोफ़ाइल फ़ोटो दिखाने का कोई तरीका है?"',
    reddit_a1: 'शीर्ष उत्तर: नहीं।',
    reddit_meta2: 'r/whatsapp · 5 साल पहले',
    reddit_q2: '"वेब और ऐप में अलग प्रोफ़ाइल फ़ोटो — क्या यह संभव है?"',
    reddit_a2: 'शीर्ष उत्तर: केवल दो नंबरों से।',
    reddit_meta3: 'r/whatsapp · 8 महीने पहले',
    reddit_q3: '"WhatsApp को कई प्रोफ़ाइल फ़ोटो सपोर्ट करनी चाहिए।"',
    reddit_a3: 'शीर्ष उत्तर: [हटा दिया]',
    tagline: 'अलग-अलग लोगों के लिए अलग-अलग फ़ोटो',
    help_btn: 'सहायता',
    upgrade_title: 'DualProfile Pro में अपग्रेड करें',
    upgrade_limit_msg: 'आप निःशुल्क सीमा (2 संपर्क) तक पहुँच गए हैं।',
    upgrade_monthly: 'मासिक — £9.99/माह',
    upgrade_annual: 'वार्षिक — £59/वर्ष',
    tag_annual: 'वार्षिक',
    tag_lifetime: 'Lifetime',
    upgrade_lifetime: 'आजीवन — एकमुश्त £79',
    upgrade_payment_note: 'Lemon Squeezy के माध्यम से सुरक्षित भुगतान।',
    upgrade_license_label: 'पहले से खरीदा? अपनी लाइसेंस कुंजी दर्ज करें:',
    upgrade_activate: 'सक्रिय करें',
    upgrade_validating: 'लाइसेंस सत्यापित हो रहा है...',
    upgrade_license_err: 'कृपया अपनी लाइसेंस कुंजी दर्ज करें',
    upgrade_close: 'बंद करें',
    upgrade_coming_soon_badge: '🚀 जल्द आ रहा है!',
    upgrade_coming_soon_msg: 'Chrome Web Store लॉन्च के बाद Pro सुविधाएँ उपलब्ध होंगी।',
    upgrade_email_placeholder: 'अर्ली एक्सेस के लिए ईमेल दर्ज करें',
    upgrade_notify_btn: 'सूचित करें',
    upgrade_signup_note: 'Pro लॉन्च होने पर सबसे पहले जानें!',
    upgrade_on_list: 'आप सूची में हैं!',
    upgrade_already_on_list: 'आप पहले से सूची में हैं!',
    upgrade_email_confirm: 'हम आपको ईमेल भेजेंगे:',
    upgrade_launch_note: 'जब Pro सुविधाएँ लॉन्च होंगी।',
    upgrade_notify_note: 'Pro लॉन्च होने पर हम आपको सूचित करेंगे।',
    lets_go: 'चलिए शुरू करें',
    pro_features_title: 'प्लान और सुविधाएँ',
    pro_unlimited_title: 'असीमित संपर्क',
    pro_unlimited_desc: 'जितने चाहें उतने संपर्कों को असाइन करें',
    pro_quickswitch_title: 'त्वरित स्विच',
    pro_quickswitch_desc: 'एक टैप में सभी P1 ⇄ P2 बदलें',
    pro_history_title: 'असाइनमेंट इतिहास',
    pro_history_desc: 'हर बदलाव का पूरा लॉग',
    pro_support_title: 'प्राथमिकता सहायता',
    pro_support_desc: 'टीम को सीधे ईमेल करें',
    pro_workmode_title: 'कार्य / व्यक्तिगत मोड',
    pro_workmode_desc: 'जल्द आ रहा है',
    pro_photohistory_title: 'फ़ोटो इतिहास और पुनर्स्थापना',
    pro_photohistory_desc: 'अपनी पिछली 3 फ़ोटो में से किसी को भी पुनर्स्थापित करें',
    feat_bulk_title: 'बल्क कॉन्टैक्ट असाइनमेंट',
    pro_schedule_title: 'शेड्यूल्ड फ़ोटो',
    pro_schedule_desc: 'दिन और समय के अनुसार फ़ोटो स्वचालित रूप से बदलें',
    pro_export_title: 'असाइनमेंट एक्सपोर्ट और इम्पोर्ट',
    pro_export_desc: 'अपने सभी संपर्क असाइनमेंट का बैकअप लें',
    pro_multidevice_title: 'मल्टी-डिवाइस सिंक',
    pro_multidevice_desc: 'आपकी प्राथमिकताएं सभी डिवाइस पर सिंक होती हैं',
    history_panel_title: 'फ़ोटो इतिहास',
    history_slot1: 'फ़ोटो 1 इतिहास', history_slot2: 'फ़ोटो 2 इतिहास',
    history_restore_btn: 'पुनर्स्थापित करें',
    history_empty: 'अभी कोई इतिहास नहीं — पिछली फ़ोटो यहाँ दिखेंगी',
    history_restored_toast: 'फ़ोटो सफलतापूर्वक पुनर्स्थापित हुई',
    history_pro_gate: 'फ़ोटो इतिहास एक Pro सुविधा है',
    schedule_panel_title: 'शेड्यूल्ड फ़ोटो',
    schedule_enable_label: 'शेड्यूल सक्षम करें',
    schedule_photo_label: 'विंडो के दौरान सक्रिय फ़ोटो',
    schedule_days_label: 'सक्रिय दिन',
    schedule_start_label: 'प्रारंभ समय', schedule_end_label: 'समाप्ति समय',
    schedule_save_btn: 'शेड्यूल सहेजें', schedule_saved_toast: 'शेड्यूल सहेजा गया',
    schedule_pro_gate: 'शेड्यूल्ड फ़ोटो एक वार्षिक सुविधा है',
    schedule_day_sun: 'रवि', schedule_day_mon: 'सोम', schedule_day_tue: 'मंगल',
    schedule_day_wed: 'बुध', schedule_day_thu: 'गुरु', schedule_day_fri: 'शुक्र', schedule_day_sat: 'शनि',
    schedule_active_badge: 'शेड्यूल सक्रिय',
    export_btn: 'असाइनमेंट एक्सपोर्ट करें', import_btn: 'असाइनमेंट इम्पोर्ट करें',
    export_success_toast: 'असाइनमेंट एक्सपोर्ट हुए', import_success_toast: 'असाइनमेंट इम्पोर्ट हुए',
    import_error_toast: 'अमान्य फ़ाइल', export_pro_gate: 'एक्सपोर्ट/इम्पोर्ट एक Lifetime सुविधा है',
    unlock_pro: 'प्लान देखें — £9.99/माह से',
    unlock_annual: 'वार्षिक अनलॉक करें — £59/वर्ष · बल्क असाइन',
    bulk_mode_label: 'बल्क चुनें',
    bulk_assigned_p1: 'फ़ोटो 1 को असाइन किया',
    bulk_assigned_p2: 'फ़ोटो 2 को असाइन किया',
    bulk_teaser: 'एक बार में सभी कार्य संपर्क चुनें। वार्षिक योजना।',
    coming_soon: 'जल्द आ रहा है',
    history_contacts_flipped: 'संपर्क बदले',
    history_removed: 'हटाया गया',
    help_title: 'DualProfile कैसे उपयोग करें',
    help_li1: '2 अलग प्रोफ़ाइल फ़ोटो अपलोड करें',
    help_li2: 'संपर्क टैब में जाएं और प्रत्येक फ़ोटो के लिए संपर्क असाइन करें',
    help_li3: 'फ़ोटो 1 के संपर्क फ़ोटो 1 देखेंगे',
    help_li4: 'फ़ोटो 2 के संपर्क फ़ोटो 2 देखेंगे',
    help_li5: 'परीक्षण के लिए लाइव पूर्वावलोकन उपयोग करें!',
    help_free_title: 'मुफ़्त स्तर',
    help_free_desc: 'आप मुफ़्त में 2 संपर्क असाइन कर सकते हैं। असीमित संपर्कों के लिए Pro में अपग्रेड करें।',
    help_trouble_title: 'समस्या निवारण',
    help_trouble_desc: 'अगर संपर्क लोड नहीं हो रहे, तो सुनिश्चित करें WhatsApp Web खुला है। पहले अपनी चैट सूची स्क्रॉल करने का प्रयास करें।',
    preview_setup_title: 'अपना सेटअप देखें',
    preview_setup_desc: 'आपके संपर्क आपकी फ़ोटो इस तरह देखेंगे:',
    preview_no_photo_label: 'कोई फ़ोटो नहीं',
    preview_close: 'बंद करें',
    waiting_for_install: 'प्रतीक्षा कर रहा है',
    to_install: 'इंस्टॉल करे…',
    p2p_sync_active: 'P2P सिंक सक्रिय',
    sync_inactive: 'निष्क्रिय',
    sync_not_configured: 'कॉन्फ़िगर नहीं — config.js में Convex/Cloudinary सेट करें',
    enter_phone_for_sync: 'P2P सिंक सक्षम करने के लिए अपना नंबर दर्ज करें',
    number_saved: '✓ नंबर सहेजा गया! P2P सिंक अब सक्रिय है।',
    change: 'बदलें',
    wa_is_active: 'DualProfile सक्रिय है',
    sync_is_live: 'सिंक चालू है। अब संपर्कों को फ़ोटो असाइन कर सकते हैं।',
    no_photo_assignment: 'इस असाइनमेंट के लिए कोई फ़ोटो अपलोड नहीं।',
    no_history_found: 'कोई इतिहास नहीं मिला।',
    one_more_step: 'एक और कदम',
    hard_refresh_msg: 'DualProfile सक्रिय करने के लिए अभी WhatsApp Web हार्ड रीफ़्रेश करें। अपने WhatsApp टैब पर Ctrl+Shift+R (Mac: Cmd+Shift+R) दबाएं।',
    upgrade_working_title: 'वे आपको देख सकते हैं। 🎉',
    upgrade_working_sub: 'आपका पहला असाइन किया गया संपर्क अब वही फ़ोटो देख रहा है जो आपने उनके लिए चुनी थी। क्या आप चाहते हैं कि सभी संपर्क आपका सही रूप देखें?',
    upgrade_working_cta: 'सभी संपर्क अनलॉक करें',
    upgrade_limit_msg_1: 'मुफ़्त प्लान: 1 संपर्क शामिल।',
        trial_setup_mode: 'सेटअप हो रहा है',
    trial_setup_desc: 'सब कुछ तैयार करें — आपका ट्रायल तब शुरू होगा जब आपका पहला संपर्क सिंक होगा।',
    trial_active_badge: '{days} दिन बचे हैं',
    trial_active_badge_1: 'आखिरी दिन',
    trial_started_title: 'आपका ट्रायल शुरू हो गया।',
    existing_user_trial_title: '🎁 नई प्रीमियम सुविधाएं जोड़ी गईं।',
    existing_user_trial_desc: '3 दिनों के लिए मुफ्त में पूर्ण एक्सेस का आनंद लें।',
    trial_started_desc: '3 दिन का पूर्ण एक्सेस। जब समय कम होगा तो हम आपको बताएंगे।',
    trial_expiring_title: 'ट्रायल कल समाप्त होगा',
    trial_expiring_desc: 'आज के बाद 1 संपर्क सक्रिय रहेगा। बाकी फ्रीज हो जाएंगे — हटाए नहीं जाएंगे।',
    trial_expired_badge: 'ट्रायल समाप्त',
    trial_expired_title: 'आपका ट्रायल समाप्त हो गया।',
    trial_expired_desc: 'आप मुफ़्त प्लान पर हैं। 1 संपर्क सक्रिय है। बाकी फ्रीज हैं।',
    trial_locked_contact: 'फ्रीज — फिर से चालू करने के लिए अपग्रेड करें',
    trial_active_contact: 'मुफ़्त प्लान पर सक्रिय',
    trial_upgrade_to_unlock: '{count} संपर्क अनलॉक करने के लिए अपग्रेड करें',
    trial_upgrade_title: 'वह सब अनलॉक करें जो आपने बनाया।',
    trial_upgrade_sub: '{count} संपर्क फ्रीज हैं। सभी को तुरंत फिर से चालू करने के लिए Pro पर जाएं।',
    trial_upgrade_cta: 'सभी संपर्क फिर से चालू करें',
    trial_days_remaining: '{days} दिन बचे',
    trial_hours_remaining: '{hours} घंटे बचे',
    trial_expires_today: 'ट्रायल आज समाप्त होगा',
    trial_label: 'मुफ़्त ट्रायल',
    trial_full_access: 'पूर्ण एक्सेस',
    trial_not_started: 'ट्रायल शुरू नहीं हुआ',
        phone_registered_placeholder: 'नंबर रजिस्टर्ड',
        settings_phone_label: 'आपका WhatsApp नंबर',
    settings_phone_helper: 'P2P फ़ोटो सिंक के लिए आवश्यक। केवल हैश के रूप में संग्रहीत।',
    settings_phone_label: 'आपका WhatsApp नंबर',
    settings_phone_helper: 'P2P फ़ोटो सिंक के लिए आवश्यक। केवल हैश के रूप में संग्रहीत।',
        settings_phone_label: 'आपका WhatsApp नंबर',
    settings_phone_helper: 'P2P फ़ोटो सिंक के लिए आवश्यक। केवल हैश के रूप में संग्रहीत।',
        refresh_prompt_waiting: 'प्रतीक्षा कर रहा है...',
  },
  ru: {
    lang_label: 'Язык',
    headline: 'Вы уже говорите по-разному в зависимости от того, кто слушает.',
    headline_bridge: 'Ваше фото — нет. Оказывается, люди просили об этом годами:',
    now_exists: 'Теперь это существует.',
    sub: 'Назначьте разные фото разным контактам — начальник видит одно, друзья — другое. Переключается автоматически. Тот же номер, тот же WhatsApp.',
    free_to_start: 'Начать бесплатно',
    works_on_web: 'Работает в WhatsApp Web',
    two_minutes: 'Настройка за 2 минуты',
    show_me: 'Показать как',
    pair_title: 'DualProfile работает между двумя людьми.',
    pair_sub: 'Когда вы назначаете кому-то фото, им тоже нужен DualProfile — иначе это лишь имитация. Отправьте им ссылку сейчас, до завершения настройки.',
    copy_link: '📎 Скопировать ссылку для установки',
    copied_msg: 'Скопировано — вставьте в WhatsApp и продолжайте',
    p2p_reminder_msg: '{name} увидит это фото, как только тоже установит DualProfile.',
    continue_setup: 'Продолжить настройку',
    invite_later: 'Приглашу позже',
    upload_title: 'Загрузите два фото.',
    upload_sub: 'Одно для работы. Одно для всего остального.',
    phone_title: 'Введите номер WhatsApp.',
    phone_sub: 'Это связывает ваши фото с вашей личностью в WhatsApp, чтобы контакты с DualProfile видели нужное фото.',
    refresh_title: 'Обновите вкладку WhatsApp Web.',
    refresh_sub: 'Это активирует DualProfile внутри WhatsApp и позволяет определять ваши контакты.',
    assign_title: 'Назначьте фото контактам.',
    assign_sub: 'Назначьте Фото 1 или Фото 2 каждому контакту. Изменить можно в любое время во вкладке «Контакты».',
    live_title: 'Вы в эфире.',
    live_sub: 'Как только контакт установит и зарегистрируется, назначенное фото появится на его экране автоматически.',
    open_wa: 'Открыть WhatsApp Web',
    copy_share: 'Скопировать ссылку',
    copy_share_confirm: 'Скопировано — отправьте контакту в WhatsApp',
    step_badge_1of3: 'Шаг 1 из 3',
    upload_title2: 'Загрузите два фото',
    upload_sub2: 'Одно для работы. Одно для жизни. Вы решаете, кто что видит.',
    upload_note: 'Для продолжения достаточно одного фото — второе можно добавить позже.',
    upload_photo1_label: 'Фото 1',
    upload_photo2_label: 'Фото 2',
    upload_tap: 'Нажмите для загрузки',
    upload_hint1: 'напр.: профессиональное, рабочее фото',
    upload_hint2: 'напр.: личное, повседневное, настоящий вы',
    upload_error: 'Загрузите хотя бы одно фото для продолжения.',
    upload_too_large: 'Изображение слишком большое. Используйте файл менее 5 МБ.',
    upload_continue: 'Продолжить',
    step_badge_2of3: 'Шаг 2 из 3',
    phone_title2: 'Зарегистрируйте номер WhatsApp',
    phone_sub2: 'Так другие пользователи DualProfile узнают вас — и ваше назначенное фото автоматически появится на их экране.',
    phone_note: 'Укажите код страны. Номер не хранится напрямую — он мгновенно преобразуется в приватный защищённый код.',
    phone_error: 'Введите корректный номер с кодом страны.',
    phone_save: 'Сохранить и продолжить',
    phone_skip: 'Сделаю позже',
    phone_saving: 'Сохранение...',
    phone_warn_title: 'Перед пропуском — вот что вы потеряете',
    phone_warn_li1: 'Другие пользователи DualProfile не узнают, что у вас есть расширение — они увидят кнопку «Пригласить» вместо вашего профиля.',
    phone_warn_li2: 'Назначенные фото не будут синхронизироваться в реальном времени.',
    phone_warn_li3: 'Без номера DualProfile работает для вас лишь наполовину.',
    phone_warn_register: 'Зарегистрировать номер',
    phone_warn_skip: 'Пропустить сейчас',
    refresh_title2: 'Обновите вкладку WhatsApp Web',
    refresh_sub2: 'Это активирует DualProfile внутри WhatsApp и позволит определять ваши контакты.',
    refresh_step1: 'Переключитесь на вкладку WhatsApp Web',
    refresh_step2: 'Нажмите F5 или Ctrl+R · Mac: Cmd+R',
    refresh_step3: 'Вернитесь сюда и нажмите «Продолжить»',
    refresh_done: 'Готово — продолжить',
    refresh_not_open: 'WhatsApp сейчас не открыт',
    step_badge_3of3: 'Шаг 3 из 3',
    assign_title2: 'Кто видит какое фото?',
    assign_sub2: 'Назначьте каждому контакту Фото 1 или Фото 2. Изменить можно в любое время во вкладке «Контакты».',
    assign_scroll_title: 'Одно действие перед загрузкой контактов',
    assign_scroll_sub: 'Переключитесь на вкладку WhatsApp Web и прокрутите список чатов вниз — это обеспечит загрузку всех контактов.',
    assign_load_btn: 'Готово — загрузить контакты',
    assign_photo1_legend: 'Ваше первое фото',
    assign_photo2_legend: 'Ваше второе фото',
    assign_loading: 'Загрузка контактов из WhatsApp...',
    assign_no_contacts: 'Контакты не найдены. Перейдите в WhatsApp Web, прокрутите чаты, затем нажмите «Повторить».',
    assign_retry: 'Повторить',
    assign_finish: 'Завершить настройку',
    assign_skip: 'Назначу контакты позже',
    assign_free_limit: 'Бесплатный план: до',
    assign_free_contacts: 'контактов.',
    assign_upgrade: 'Перейти на Pro →',
    live_badge_active: '● В ЭФИРЕ',
    live_badge_almost: '⚠ Почти готово',
    live_title_full: 'Отныне каждый видит именно то, что вы хотите.',
    live_title_almost: 'Почти готово — остался один шаг.',
    live_will_see_p1: 'Увидит ваше Фото 1 ✓',
    live_will_see_p2: 'Увидит ваше Фото 2 ✓',
    live_no_assign: 'Ваши фото готовы. Назначайте контакты в любое время во вкладке «Контакты».',
    live_check_photos: 'Фото загружены',
    live_check_registered: 'Вы в сети DualProfile',
    live_check_not_registered: 'Номер не зарегистрирован —',
    live_fix_this: 'исправить →',
    live_warn_detail: 'Без номера контакты видят кнопку «Пригласить» вместо вашего фото, и синхронизация в реальном времени не работает.',
    live_fully_active: 'DualProfile полностью активен',
    live_partly_active: 'DualProfile частично активен',
    live_nudge: 'Нужно больше 2 контактов?',
    live_upgrade: 'Перейти на Pro →',
    live_network_title: 'Важно — как работает DualProfile',
    live_network_body: 'Чтобы контакт увидел ваше назначенное фото, ему тоже нужно установить DualProfile. После установки ваше фото появится на его экране автоматически — никаких дополнительных шагов.',
    live_copy_link: 'Скопировать ссылку для установки',
    live_copied: 'Скопировано — отправьте контакту в WhatsApp',
    live_continue: 'Продолжить',
    tab_preview: 'Предпросмотр',
    tab_photos: 'Фото',
    tab_contacts: 'Контакты',
    tab_settings: 'Настройки',
    status_active: 'Расширение активно',
    status_disabled: 'Расширение отключено',
    preview_hero_title: 'Симуляция в реальном времени',
    preview_hero_sub: 'Посмотрите, как вас видят разные люди в WhatsApp',
    preview_label: 'Предпросмотр как:',
    preview_select: 'Выберите контакт...',
    preview_hint: 'Ваше фото профиля WhatsApp обновляется в реальном времени при смене контакта',
    preview_exit_btn: 'Выйти из предпросмотра',
    preview_no_photo: 'Сначала загрузите фото, затем выберите контакт выше',
    preview_go_photos: 'Загрузить фото →',
    invite_choose_style: 'Выберите стиль:',
    invite_copy_btn: 'Копировать сообщение',
    invite_wa_btn: 'Отправить в WhatsApp →',
    photo_click_upload: 'Нажмите для загрузки',
    photo1_label: 'Фото 1',
    photo2_label: 'Фото 2',
    photo_default_label: 'Фото по умолчанию для неназначенных контактов:',
    photo_live_preview: 'Предпросмотр в реальном времени',
    photo_preview_desc: 'Смотрите, как меняется ваш аватар в WhatsApp Web:',
    photo_preview_select: 'Выбрать контакт...',
    photo_preview_as: 'Предпросмотр как:',
    exit_preview_mode: 'Выйти из режима предпросмотра',
    contacts_loading: 'Загрузка контактов из WhatsApp...',
    contacts_open_wa: 'Откройте WhatsApp Web для просмотра контактов',
    contacts_used: 'Бесплатный план:',
    contacts_upgrade: 'Перейти на Pro',
    quick_switch: '⇄ Быстрое переключение',
    history_btn: '📋 История',
    select_contact: 'Выбрать контакт...',
    register_now: 'Зарегистрироваться →',
    save_number: 'Сохранить номер',
    settings_appearance: 'Внешний вид',
    settings_theme: 'Тема',
    settings_theme_desc: 'Выберите предпочтительную цветовую схему',
    settings_preview: 'Предпросмотр',
    settings_test: 'Проверить настройки',
    settings_test_desc: 'Посмотрите, как контакты будут видеть ваши фото',
    settings_tutorial: 'Обучение',
    settings_replay: 'Повторить введение',
    settings_replay_desc: 'Посмотреть обучающий ролик ещё раз',
    settings_replay_btn: 'Повторить',
    settings_data: 'Данные',
    settings_clear: 'Очистить все данные',
    settings_preview_btn: 'Предпросмотр',
    copied_btn: 'Скопировано!',
    switching: '⇄ Переключение…',
    switched: '✓ Переключено!',
    no_contacts_wa: 'Контакты не найдены. Убедитесь, что WhatsApp Web загружен.',
    contacts_load_err: 'Не удалось загрузить контакты. Попробуйте обновить WhatsApp Web.',
    activating_preview: 'Активация предпросмотра...',
    open_wa_first: 'Откройте WhatsApp Web для использования предпросмотра.',
    preview_failed: 'Предпросмотр не удался.',
    no_wa_connect: 'Не удалось подключиться к WhatsApp Web.',
    confirm_clear: 'Очистить все данные? Это действие нельзя отменить.',
    number_mismatch: 'Ваш зарегистрированный номер не совпадает с открытым аккаунтом WhatsApp.',
    update_number: 'Обновить номер',
    how_to_refresh: 'Как обновить',
    refresh_instructions: 'Нажмите F5 (или Cmd+R на Mac) во вкладке WhatsApp Web, затем снова откройте этот popup.',
    waiting_refresh: 'Ожидание обновления…',
    wa_active: '✓ Активно',
    wa_open_first: 'Сначала откройте WhatsApp Web',
    reddit_meta1: 'r/whatsapp · 9 лет назад',
    reddit_q1: '"Можно ли показывать разным людям разные фото профиля?"',
    reddit_a1: 'Лучший ответ: Нет.',
    reddit_meta2: 'r/whatsapp · 5 лет назад',
    reddit_q2: '"Разные фото профиля в веб и в приложении — это возможно?"',
    reddit_a2: 'Лучший ответ: Только с двумя номерами.',
    reddit_meta3: 'r/whatsapp · 8 месяцев назад',
    reddit_q3: '"WhatsApp должен поддерживать несколько фото профиля."',
    reddit_a3: 'Лучший ответ: [удалено]',
    tagline: 'Разные фото для разных людей',
    help_btn: 'Помощь',
    upgrade_title: 'Перейти на DualProfile Pro',
    upgrade_limit_msg: 'Вы достигли лимита бесплатного плана (2 контакта).',
    upgrade_monthly: 'Ежемесячно — £9.99/мес',
    upgrade_annual: 'Годовой — £59/год',
    tag_annual: 'Годовой',
    tag_lifetime: 'Lifetime',
    upgrade_lifetime: 'Пожизненно — £79 единоразово',
    upgrade_payment_note: 'Безопасная оплата через Lemon Squeezy.',
    upgrade_license_label: 'Уже купили? Введите лицензионный ключ:',
    upgrade_activate: 'Активировать',
    upgrade_validating: 'Проверка лицензии...',
    upgrade_license_err: 'Пожалуйста, введите лицензионный ключ',
    upgrade_close: 'Закрыть',
    upgrade_coming_soon_badge: '🚀 Скоро!',
    upgrade_coming_soon_msg: 'Функции Pro будут доступны после запуска в Chrome Web Store.',
    upgrade_email_placeholder: 'Введите email для раннего доступа',
    upgrade_notify_btn: 'Уведомить меня',
    upgrade_signup_note: 'Узнайте первыми о запуске Pro!',
    upgrade_on_list: 'Вы в списке!',
    upgrade_already_on_list: 'Вы уже в списке!',
    upgrade_email_confirm: 'Мы отправим письмо на:',
    upgrade_launch_note: 'когда функции Pro будут запущены.',
    upgrade_notify_note: 'Мы уведомим вас о запуске Pro.',
    lets_go: 'Начать',
    pro_features_title: 'Планы и функции',
    pro_unlimited_title: 'Безлимитные контакты',
    pro_unlimited_desc: 'Назначайте любое количество контактов',
    pro_quickswitch_title: 'Быстрое переключение',
    pro_quickswitch_desc: 'Поменять все P1 ⇄ P2 одним нажатием',
    pro_history_title: 'История назначений',
    pro_history_desc: 'Полный журнал всех изменений',
    pro_support_title: 'Приоритетная поддержка',
    pro_support_desc: 'Прямой email-доступ к команде',
    pro_workmode_title: 'Режим работа/личное',
    pro_workmode_desc: 'Скоро',
    pro_photohistory_title: 'История фото и восстановление',
    pro_photohistory_desc: 'Восстановите любое из последних 3 фото',
    feat_bulk_title: 'Массовое назначение контактов',
    pro_schedule_title: 'Запланированные фото',
    pro_schedule_desc: 'Автопереключение фото по дням и времени',
    pro_export_title: 'Экспорт и импорт назначений',
    pro_export_desc: 'Резервное копирование и восстановление назначений',
    pro_multidevice_title: 'Мультиустройственная синхронизация',
    pro_multidevice_desc: 'Ваши настройки синхронизируются на всех устройствах',
    history_panel_title: 'История фото',
    history_slot1: 'История фото 1', history_slot2: 'История фото 2',
    history_restore_btn: 'Восстановить',
    history_empty: 'История пуста — предыдущие фото появятся здесь',
    history_restored_toast: 'Фото успешно восстановлено',
    history_pro_gate: 'История фото — функция Pro',
    schedule_panel_title: 'Запланированные фото',
    schedule_enable_label: 'Включить расписание',
    schedule_photo_label: 'Активное фото в окне',
    schedule_days_label: 'Активные дни',
    schedule_start_label: 'Время начала', schedule_end_label: 'Время окончания',
    schedule_save_btn: 'Сохранить расписание', schedule_saved_toast: 'Расписание сохранено',
    schedule_pro_gate: 'Запланированные фото — функция годового плана',
    schedule_day_sun: 'Вс', schedule_day_mon: 'Пн', schedule_day_tue: 'Вт',
    schedule_day_wed: 'Ср', schedule_day_thu: 'Чт', schedule_day_fri: 'Пт', schedule_day_sat: 'Сб',
    schedule_active_badge: 'Расписание активно',
    export_btn: 'Экспорт назначений', import_btn: 'Импорт назначений',
    export_success_toast: 'Назначения экспортированы', import_success_toast: 'Назначения импортированы',
    import_error_toast: 'Неверный файл', export_pro_gate: 'Экспорт/импорт — функция Lifetime',
    unlock_pro: 'Смотреть планы — от £9.99/мес',
    unlock_annual: 'Разблокировать Годовой — £59/год · Массовое назначение',
    bulk_mode_label: 'Массовый выбор',
    bulk_assigned_p1: 'Назначено фото 1',
    bulk_assigned_p2: 'Назначено фото 2',
    bulk_teaser: 'Выберите все рабочие контакты сразу. Годовой план.',
    coming_soon: 'Скоро',
    history_contacts_flipped: 'контактов переключено',
    history_removed: 'удалён',
    help_title: 'Как использовать DualProfile',
    help_li1: 'Загрузите 2 разных фото профиля',
    help_li2: 'Перейдите в «Контакты» и назначьте контакты каждому фото',
    help_li3: 'Контакты фото 1 увидят фото 1',
    help_li4: 'Контакты фото 2 увидят фото 2',
    help_li5: 'Используйте Live Preview для проверки!',
    help_free_title: 'Бесплатный план',
    help_free_desc: 'Можно назначить до 2 контактов бесплатно. Обновитесь до Pro для безлимита.',
    help_trouble_title: 'Устранение неполадок',
    help_trouble_desc: 'Если контакты не загружаются, убедитесь, что WhatsApp Web открыт и полностью загружен. Попробуйте сначала прокрутить список чатов.',
    preview_setup_title: 'Предпросмотр настроек',
    preview_setup_desc: 'Вот как контакты увидят ваши фото:',
    preview_no_photo_label: 'Нет фото',
    preview_close: 'Закрыть',
    waiting_for_install: 'Ожидание установки от',
    to_install: '…',
    p2p_sync_active: 'P2P-синхронизация активна',
    sync_inactive: 'Неактивно',
    sync_not_configured: 'Не настроено — задайте Convex/Cloudinary в config.js',
    enter_phone_for_sync: 'Введите номер для включения P2P-синхронизации',
    number_saved: '✓ Номер сохранён! P2P-синхронизация активна.',
    change: 'Изменить',
    wa_is_active: 'DualProfile активен',
    sync_is_live: 'Синхронизация активна. Теперь можно назначать фото контактам.',
    no_photo_assignment: 'Для этого назначения не загружено фото.',
    no_history_found: 'История не найдена.',
    one_more_step: 'Ещё один шаг',
    hard_refresh_msg: 'Теперь выполните жёсткое обновление WhatsApp Web для активации DualProfile. Нажмите Ctrl+Shift+R (Mac: Cmd+Shift+R) на вкладке WhatsApp.',
    upgrade_working_title: 'Они вас видят. 🎉',
    upgrade_working_sub: 'Ваш первый назначенный контакт теперь видит именно то фото, которое вы для него выбрали. Хотите, чтобы все контакты видели нужную версию вас?',
    upgrade_working_cta: 'Разблокировать все контакты',
    upgrade_limit_msg_1: 'Бесплатный план: 1 контакт включён.',
        trial_setup_mode: 'Настройка',
    trial_setup_desc: 'Подготовьтесь — пробный период начнётся, когда первый контакт синхронизируется.',
    trial_active_badge: 'Осталось {days} дня',
    trial_active_badge_1: 'Последний день',
    trial_started_title: 'Ваш пробный период начался.',
    existing_user_trial_title: '🎁 Добавлены новые премиум-функции.',
    existing_user_trial_desc: '3 дня полного доступа бесплатно.',
    trial_started_desc: '3 дня полного доступа. Мы уведомим вас, когда время будет заканчиваться.',
    trial_expiring_title: 'Пробный период заканчивается завтра',
    trial_expiring_desc: 'После сегодняшнего дня 1 контакт останется активным. Остальные будут заморожены — не удалены.',
    trial_expired_badge: 'Пробный период завершён',
    trial_expired_title: 'Ваш пробный период завершён.',
    trial_expired_desc: 'Вы на бесплатном плане. 1 контакт остаётся активным. Остальные заморожены.',
    trial_locked_contact: 'Заморожен — обновитесь для повторной активации',
    trial_active_contact: 'Активен на бесплатном плане',
    trial_upgrade_to_unlock: 'Обновитесь, чтобы разблокировать все {count} контактов',
    trial_upgrade_title: 'Разблокируйте всё, что вы создали.',
    trial_upgrade_sub: '{count} контактов заморожены. Перейдите на Pro, чтобы мгновенно реактивировать их все.',
    trial_upgrade_cta: 'Реактивировать все контакты',
    trial_days_remaining: 'Осталось {days} дней',
    trial_hours_remaining: 'Осталось {hours} часов',
    trial_expires_today: 'Пробный период истекает сегодня',
    trial_label: 'Бесплатный пробный период',
    trial_full_access: 'Полный доступ',
    trial_not_started: 'Пробный период не начат',
        phone_registered_placeholder: 'Номер зарегистрирован',
        settings_phone_label: 'Ваш номер WhatsApp',
    settings_phone_helper: 'Необходим для P2P-синхронизации фото. Хранится только в виде хэша.',
    settings_phone_label: 'Ваш номер WhatsApp',
    settings_phone_helper: 'Необходим для P2P-синхронизации фото. Хранится только в виде хэша.',
        settings_phone_label: 'Ваш номер WhatsApp',
    settings_phone_helper: 'Необходим для P2P-синхронизации фото. Хранится только в виде хэша.',
        refresh_prompt_waiting: 'Ожидание...',
  },
};

function dpGetLang() {
  return localStorage.getItem('dp_lang') || 'en';
}
function dpT(key) {
  const lang = dpGetLang();
  const val = (DP_I18N[lang] && DP_I18N[lang][key]) || DP_I18N['en'][key];
  if (val === undefined) {
    // Key completely missing from DP_I18N — log once so devs notice
    if (typeof console !== 'undefined') console.warn('[DualProfile i18n] Missing key:', key);
    return key; // return raw key as fallback so UI never shows undefined/blank
  }
  return val;
}

/**
 * DP_I18N Schema Validator
 * Runs once on extension load in dev/debug environments.
 * Validates that every language has exactly the same keys as English.
 * Silent in production (no user-visible output).
 *
 * Architecture note: this is the CI-style enforcement layer that makes
 * 244-key × 9-language parity auditable without a build system.
 */
(function dpValidateI18n() {
  try {
    const enKeys = Object.keys(DP_I18N.en);
    const langs = Object.keys(DP_I18N);
    const missing = {};
    const extra = {};
    let valid = true;

    for (const lang of langs) {
      if (lang === 'en') continue;
      const langKeys = Object.keys(DP_I18N[lang]);
      const miss = enKeys.filter(k => !(k in DP_I18N[lang]));
      const xtra = langKeys.filter(k => !(k in DP_I18N.en));
      if (miss.length) { missing[lang] = miss; valid = false; }
      if (xtra.length) { extra[lang] = xtra; valid = false; }
    }

    if (!valid) {
      console.error('[DualProfile i18n] SCHEMA VIOLATION — parity broken:',
        Object.keys(missing).length ? 'MISSING: ' + JSON.stringify(missing) : '',
        Object.keys(extra).length  ? 'EXTRA: '   + JSON.stringify(extra)   : ''
      );
    }
    // Store validation result so popup.js can surface a dev warning if needed
    window.__dpI18nValid = valid;
    window.__dpI18nKeyCount = enKeys.length;
    window.__dpI18nLangs = langs.length;
  } catch (e) {
    // Never throw — validator must not break the extension
  }
})();

/**
 * DualProfile Onboarding Flow — v1.0.3
 * Pair-first. Invite prompt surfaces at step 2, before any setup work.
 * Network effect communicated clearly and early.
 * i18n: 8 languages — EN, ES, ZH, JA, FR, PT, DE, HI
 */

class DualProfileOnboarding {
  static FREE_TIER_LIMIT = 1;

  constructor() {
    this.currentStep = 1;
    this.totalSteps = 8;
    this.photos = { photo1: null, photo2: null };
    this.assignedContacts = { photo1: [], photo2: [] };
    this.modal = null;
    this.waContacts = [];
    this.returnAfterPhone = false;
  }

  async shouldShowOnboarding() {
    return new Promise(resolve => {
      chrome.storage.local.get(null, (allData) => {
        // Log everything so we can see exactly what's in storage
        console.log('[DualProfile][Onboarding] Full storage:', JSON.stringify(allData));
        console.log('[DualProfile][Onboarding] dp_onboarding_complete =', allData.dp_onboarding_complete);
        console.log('[DualProfile][Onboarding] myPhoneHash =', allData.myPhoneHash);
        const shouldShow = !allData.dp_onboarding_complete;
        console.log('[DualProfile][Onboarding] shouldShow =', shouldShow);
        resolve(shouldShow);
      });
    });
  }

  async getSavedStep() {
    return new Promise(resolve => {
      chrome.storage.local.get(['dp_onboarding_step'], (data) => {
        resolve(data.dp_onboarding_step ? parseInt(data.dp_onboarding_step, 10) : 1);
      });
    });
  }

  saveStep(step) {
    chrome.storage.local.set({ dp_onboarding_step: step.toString() });
  }

  completeOnboarding() {
    chrome.storage.local.set({ dp_onboarding_complete: 'true' });
    chrome.storage.local.remove('dp_onboarding_step');
  }

  static resetOnboarding() {
    chrome.storage.local.remove(['dp_onboarding_complete', 'dp_onboarding_step']);
  }

  async start() {
    const show = await this.shouldShowOnboarding();
    if (!show) return;
    this.currentStep = await this.getSavedStep();
    this.createModal();
    this.renderStep(this.currentStep);
  }

  async replay() {
    DualProfileOnboarding.resetOnboarding();
    this.currentStep = 1;
    this.photos = { photo1: null, photo2: null };
    this.assignedContacts = { photo1: [], photo2: [] };
    this.createModal();
    this.renderStep(1);
  }

  createModal() {
    const existing = document.querySelector('.onboarding-modal');
    if (existing) existing.remove();

    this.modal = document.createElement('div');
    this.modal.className = 'onboarding-modal';
    this.modal.innerHTML = `
      <div class="onboarding-content">
        <button class="onboarding-skip" id="onboardingSkip" style="display:none">Skip</button>
        <div class="onboarding-progress-bar">
          <div class="progress-fill" style="width:${(1 / this.totalSteps) * 100}%"></div>
        </div>
        <div class="onboarding-body"></div>
      </div>
    `;

    document.body.appendChild(this.modal);

    this.modal.querySelector('#onboardingSkip').addEventListener('click', () => {
      if (this.currentStep >= 6) this.finishOnboarding();
    });

    requestAnimationFrame(() => this.modal.classList.add('visible'));
  }

  updateProgress() {
    const fill = this.modal.querySelector('.progress-fill');
    if (fill) fill.style.width = `${(this.currentStep / this.totalSteps) * 100}%`;
    const skip = this.modal.querySelector('#onboardingSkip');
    if (skip) skip.style.display = this.currentStep >= 6 ? 'block' : 'none';
  }

  renderStep(step) {
    this.currentStep = step;
    this.saveStep(step);
    this.updateProgress();

    const body = this.modal.querySelector('.onboarding-body');
    body.style.opacity = '0';
    body.style.transform = 'translateX(20px)';

    setTimeout(() => {
      switch (step) {
        case 1: this.renderWelcome(body); break;
        case 2: this.renderPairPrompt(body); break;
        case 3: this.renderUploadPhotos(body); break;
        case 4: this.renderPhoneNumber(body); break;
        case 5: this.renderRefreshWhatsApp(body); break;
        case 6: this.renderAssignContacts(body); break;
        case 7: this.renderYoureLive(body); break;
      }
      requestAnimationFrame(() => {
        body.style.opacity = '1';
        body.style.transform = 'translateX(0)';
      });
    }, 150);
  }

  // ─────────────────────────────────────────────────────────
  // STEP 1 — Welcome: Sell the dream immediately
  // ─────────────────────────────────────────────────────────
  renderWelcome(container) {
    const langs = [
      { code: 'en', flag: '🇺🇸', label: 'English' },
      { code: 'es', flag: '🇪🇸', label: 'Español' },
      { code: 'zh', flag: '🇨🇳', label: '中文' },
      { code: 'ja', flag: '🇯🇵', label: '日本語' },
      { code: 'fr', flag: '🇫🇷', label: 'Français' },
      { code: 'pt', flag: '🇧🇷', label: 'Português' },
      { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
      { code: 'hi', flag: '🇮🇳', label: 'हिन्दी' },
      { code: 'ru', flag: '🇷🇺', label: 'Русский' },
    ];
    const current = dpGetLang();

    container.innerHTML = `
      <div class="ob-step ob-welcome">

        <div class="ob-lang-picker">
          ${langs.map(l => `
            <button class="ob-lang-btn ${l.code === current ? 'active' : ''}" data-lang="${l.code}">
              <span class="ob-lang-flag">${l.flag}</span>
              <span class="ob-lang-name">${l.label}</span>
            </button>
          `).join('')}
        </div>

        <div class="ob-logo-mark">🎭</div>
        <h1 class="ob-headline">${dpT('headline')}</h1>
        <p class="ob-headline-bridge">${dpT('headline_bridge')}</p>

        <div class="ob-reddit-quotes">
          <div class="ob-reddit-quote">
            <div class="ob-reddit-meta">${dpT('reddit_meta1')}</div>
            <div class="ob-reddit-text">${dpT('reddit_q1')}</div>
            <div class="ob-reddit-answer bad">${dpT('reddit_a1')}</div>
          </div>
          <div class="ob-reddit-quote">
            <div class="ob-reddit-meta">${dpT('reddit_meta2')}</div>
            <div class="ob-reddit-text">${dpT('reddit_q2')}</div>
            <div class="ob-reddit-answer bad">${dpT('reddit_a2')}</div>
          </div>
          <div class="ob-reddit-quote">
            <div class="ob-reddit-meta">${dpT('reddit_meta3')}</div>
            <div class="ob-reddit-text">${dpT('reddit_q3')}</div>
            <div class="ob-reddit-answer bad">${dpT('reddit_a3')}</div>
          </div>
        </div>

        <div class="ob-welcome-divider">
          <span>${dpT('now_exists')}</span>
        </div>

        <p class="ob-sub">${dpT('sub')}</p>

        <button class="btn-promise" id="step1Next">
          ${dpT('show_me')} <span class="btn-arrow">→</span>
        </button>

        <div class="ob-pill-row" style="margin-top:12px;">
          <div class="ob-pill">${dpT('free_to_start')}</div>
          <div class="ob-pill">${dpT('works_on_web')}</div>
          <div class="ob-pill">${dpT('two_minutes')}</div>
        </div>
      </div>
    `;

    // Language switcher
    container.querySelectorAll('.ob-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        localStorage.setItem('dp_lang', btn.dataset.lang);
        this.renderStep(1);
      });
    });

    container.querySelector('#step1Next').addEventListener('click', () => this.renderStep(2));
  }

  // ─────────────────────────────────────────────────────────
  // STEP 2 — The Problem: Make them feel it
  // ─────────────────────────────────────────────────────────
  renderPairPrompt(container) {
    container.innerHTML = `
      <div class="ob-step ob-problem">
        <h2 class="ob-title">${dpT('pair_title')}</h2>
        <p class="ob-sub">${dpT('pair_sub')}</p>
        <div class="ob-pair-share">
          <button class="ob-copy-link-btn" id="pairCopyLink" style="width:100%;margin-bottom:8px;">
            ${dpT('copy_link')}
          </button>
          <div class="ob-copy-confirm hidden" id="pairCopyConfirm">
            ${dpT('copied_msg')}
          </div>
        </div>
        <button class="btn-promise" id="step2Next">
          ${dpT('continue_setup')} <span class="btn-arrow">→</span>
        </button>
        <button class="ob-skip-link" id="step2Solo">${dpT('invite_later')}</button>
      </div>
    `;

    container.querySelector('#pairCopyLink').addEventListener('click', () => {
      const url = 'https://chromewebstore.google.com/detail/dualprofile/mdlhdncmaeepcejdbpnjpjlmagmmpkpc';
      navigator.clipboard.writeText(url).catch(() => {});
      const confirm = container.querySelector('#pairCopyConfirm');
      confirm.classList.remove('hidden');
      setTimeout(() => confirm.classList.add('hidden'), 4000);
    });

    container.querySelector('#step2Next').addEventListener('click', () => this.renderStep(3));
    container.querySelector('#step2Solo').addEventListener('click', () => this.renderStep(3));
  }

  // ─────────────────────────────────────────────────────────
  // STEP 3 — Upload Photos
  // ─────────────────────────────────────────────────────────
  renderUploadPhotos(container) {
    container.innerHTML = `
      <div class="ob-step ob-upload">
        <div class="ob-step-badge">${dpT('step_badge_1of3')}</div>
        <h2 class="ob-title">${dpT('upload_title2')}</h2>
        <p class="ob-sub" style="margin-bottom:6px;">
          ${dpT('upload_sub2')}
        </p>
        <p class="ob-note" style="margin-bottom:16px;opacity:1;">
          ${dpT('upload_note')}
        </p>

        <div class="upload-grid">
          <div class="upload-card" id="card1">
            <div class="upload-label">${dpT('upload_photo1_label')}</div>
            <div class="upload-preview" id="uploadPreview1">
              <div class="upload-placeholder">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                <span>${dpT('upload_tap')}</span>
              </div>
              <img class="preview-img hidden" id="previewImg1" alt="">
            </div>
            <div class="upload-hint">${dpT('upload_hint1')}</div>
            <input type="file" id="uploadInput1" accept="image/*" hidden>
          </div>
          <div class="upload-card" id="card2">
            <div class="upload-label">${dpT('upload_photo2_label')}</div>
            <div class="upload-preview" id="uploadPreview2">
              <div class="upload-placeholder">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                <span>${dpT('upload_tap')}</span>
              </div>
              <img class="preview-img hidden" id="previewImg2" alt="">
            </div>
            <div class="upload-hint">${dpT('upload_hint2')}</div>
            <input type="file" id="uploadInput2" accept="image/*" hidden>
          </div>
        </div>

        <p id="uploadHintMsg" style="font-size:11px;color:#ef4444;margin:6px 0 0;text-align:center;min-height:16px;display:none;">
          ${dpT('upload_error')}
        </p>

        <button class="btn-promise" id="uploadNext" disabled>
          ${dpT('upload_continue')} <span class="btn-arrow">→</span>
        </button>
      </div>
    `;

    [1, 2].forEach(num => {
      const preview = container.querySelector(`#uploadPreview${num}`);
      const input = container.querySelector(`#uploadInput${num}`);
      const img = container.querySelector(`#previewImg${num}`);
      preview.addEventListener('click', () => input.click());
      preview.addEventListener('dragover', e => { e.preventDefault(); preview.classList.add('drag-over'); });
      preview.addEventListener('dragleave', () => preview.classList.remove('drag-over'));
      preview.addEventListener('drop', e => {
        e.preventDefault(); preview.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith('image/')) this.handlePhotoUpload(num, file, img, preview, container);
      });
      input.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) this.handlePhotoUpload(num, file, img, preview, container);
      });
    });

    const btn = container.querySelector('#uploadNext');
    const hintMsg = container.querySelector('#uploadHintMsg');
    btn.style.pointerEvents = 'auto';
    btn.addEventListener('click', () => {
      if (!(this.photos.photo1 || this.photos.photo2)) {
        hintMsg.style.display = 'block';
        setTimeout(() => { hintMsg.style.display = 'none'; }, 3000);
        return;
      }
      this.savePhotosToStorage().then(() => this.renderStep(4)).catch(() => this.renderStep(4));
    });
  }

  handlePhotoUpload(num, file, imgEl, previewEl, container) {
    if (file.size > 5 * 1024 * 1024) {
      alert(dpT('upload_too_large'));
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const base64 = e.target.result;
      this.photos[`photo${num}`] = base64;
      imgEl.src = base64;
      imgEl.classList.remove('hidden');
      previewEl.querySelector('.upload-placeholder').style.display = 'none';
      previewEl.classList.add('has-image');
      const hint = container.querySelector('#uploadHintMsg');
      if (hint) hint.style.display = 'none';
      // Re-enable Continue button now that at least one photo exists
      const btn = container.querySelector('#uploadNext');
      if (btn) btn.disabled = !(this.photos.photo1 || this.photos.photo2);
    };
    reader.readAsDataURL(file);
  }

  async savePhotosToStorage() {
    if (this.photos.photo1) await DualProfileStorage.savePhoto(1, this.photos.photo1);
    if (this.photos.photo2) await DualProfileStorage.savePhoto(2, this.photos.photo2);
  }

  // ─────────────────────────────────────────────────────────
  // STEP 4 — Phone Number
  // ─────────────────────────────────────────────────────────
  renderPhoneNumber(container) {
    container.innerHTML = `
      <div class="ob-step ob-phone">
        <div class="ob-step-badge">${dpT('step_badge_2of3')}</div>
        <h2 class="ob-title">${dpT('phone_title2')}</h2>
        <p class="ob-sub">
          ${dpT('phone_sub2')}
        </p>

        <div class="ob-phone-input-wrap">
          <div class="ob-phone-prefix">+</div>
          <input
            type="tel"
            id="obPhoneInput"
            class="ob-phone-input"
            placeholder="1234567890"
            maxlength="20"
            autocomplete="tel"
          >
        </div>

        <div class="ob-phone-note">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          ${dpT('phone_note')}
        </div>

        <div id="obPhoneError" class="ob-error" style="display:none">${dpT('phone_error')}</div>

        <button class="btn-promise" id="step4Next" disabled>
          ${dpT('phone_save')} <span class="btn-arrow">→</span>
        </button>

        <button class="ob-skip-link" id="step4Skip">${dpT('phone_skip')}</button>
      </div>
    `;

    const input = container.querySelector('#obPhoneInput');
    const nextBtn = container.querySelector('#step4Next');
    const errMsg = container.querySelector('#obPhoneError');

    chrome.storage.local.get('userPhone', r => {
      if (r.userPhone) { input.value = r.userPhone; nextBtn.disabled = false; }
    });

    input.addEventListener('input', () => {
      const val = input.value.replace(/\D/g, '');
      input.value = val;
      nextBtn.disabled = val.length < 7;
      errMsg.style.display = 'none';
    });

    nextBtn.addEventListener('click', async () => {
      const phone = input.value.replace(/\D/g, '');
      if (phone.length < 7) { errMsg.style.display = 'block'; return; }
      nextBtn.disabled = true;
      nextBtn.textContent = dpT('phone_saving');
      const nextStep = this.returnAfterPhone ? 7 : 5;
      this.returnAfterPhone = false;
      try {
        await DualProfileStorage.registerPhone(phone);

        // Fix A: Start live subscription immediately after phone registration.
        // Onboarding has its own phone handler — popup.js handleSavePhone is never
        // called for new users, so RESTART_LIVE_SUB was never sent. New users had
        // no WS subscription for their entire first session.
        DualProfileStorage.sendMessage('RESTART_LIVE_SUB').catch(() => {});

        // Fix A: Re-upload any photos saved before phone registration.
        // Photos are stored locally in step 3 before the phone is known.
        // syncPhoto only fires automatically when phoneSet is already true at
        // upload time — which it isn't during onboarding. Without a Cloudinary
        // URL the other device always gets null, forever.
        setTimeout(async () => {
          try {
            const stored = await new Promise(r => chrome.storage.local.get('state', r));
            const localPhotos = stored.state && stored.state.photos;
            if (localPhotos && localPhotos.photo1) {
              DualProfileStorage.syncPhoto(1, localPhotos.photo1).catch(() => {});
            }
            if (localPhotos && localPhotos.photo2) {
              DualProfileStorage.syncPhoto(2, localPhotos.photo2).catch(() => {});
            }
          } catch(_) {}
        }, 800);

        this.renderStep(nextStep);
      } catch (e) {
        await chrome.storage.local.set({ userPhone: phone });
        this.renderStep(nextStep);
      }
    });

    container.querySelector('#step4Skip').addEventListener('click', () => {
      const wrap = container.querySelector('.ob-phone-input-wrap');
      if (!wrap) { this.renderStep(5); return; }
      const existing = container.querySelector('#ob-skip-warning');
      if (existing) { this.renderStep(5); return; }

      const warning = document.createElement('div');
      warning.id = 'ob-skip-warning';
      warning.className = 'ob-skip-warning-box';
      warning.innerHTML = [
        `<div class="ob-warn-title">${dpT('phone_warn_title')}</div>`,
        '<ul class="ob-warn-list">',
        `<li>${dpT('phone_warn_li1')}</li>`,
        `<li>${dpT('phone_warn_li2')}</li>`,
        `<li>${dpT('phone_warn_li3')}</li>`,
        '</ul>',
        '<div class="ob-warn-actions">',
        `<button id="ob-skip-reconsider" class="ob-warn-btn-primary">${dpT('phone_warn_register')}</button>`,
        `<button id="ob-skip-confirm" class="ob-warn-btn-ghost">${dpT('phone_warn_skip')}</button>`,
        '</div>'
      ].join('');

      wrap.parentNode.insertBefore(warning, wrap);
      warning.querySelector('#ob-skip-reconsider').addEventListener('click', () => {
        warning.remove();
        container.querySelector('#obPhoneInput')?.focus();
      });
      warning.querySelector('#ob-skip-confirm').addEventListener('click', () => this.renderStep(5));
    });
  }

  // ─────────────────────────────────────────────────────────
  // STEP 5 — Refresh WhatsApp
  // ─────────────────────────────────────────────────────────
  renderRefreshWhatsApp(container) {
    container.innerHTML = `
      <div class="ob-step ob-refresh">
        <div class="ob-refresh-icon">
          <div class="ob-refresh-circle">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
          </div>
        </div>

        <h2 class="ob-title">${dpT('refresh_title2')}</h2>
        <p class="ob-sub">${dpT('refresh_sub2')}</p>

        <div class="ob-refresh-steps">
          <div class="ob-refresh-step">
            <div class="ob-step-num">1</div>
            <div class="ob-step-text">${dpT('refresh_step1')}</div>
          </div>
          <div class="ob-refresh-step">
            <div class="ob-step-num">2</div>
            <div class="ob-step-text">${dpT('refresh_step2')}</div>
          </div>
          <div class="ob-refresh-step">
            <div class="ob-step-num">3</div>
            <div class="ob-step-text">${dpT('refresh_step3')}</div>
          </div>
        </div>

        <button class="btn-promise" id="step5Next">
          ${dpT('refresh_done')} <span class="btn-arrow">→</span>
        </button>

        <button class="ob-skip-link" id="step5Skip">${dpT('refresh_not_open')}</button>
      </div>
    `;
    container.querySelector('#step5Next').addEventListener('click', () => this.renderStep(6));
    container.querySelector('#step5Skip').addEventListener('click', () => this.renderStep(6));
  }

  // ─────────────────────────────────────────────────────────
  // STEP 6 — Assign Contacts
  // ─────────────────────────────────────────────────────────
  async renderAssignContacts(container) {
    container.innerHTML = `
      <div class="ob-step ob-assign">
        <div class="ob-step-badge">${dpT('step_badge_3of3')}</div>
        <h2 class="ob-title">${dpT('assign_title2')}</h2>
        <p class="ob-sub">${dpT('assign_sub2')}</p>

        <div class="ob-scroll-prompt" id="obScrollPrompt">
          <p style="font-size:13px;font-weight:700;color:var(--text-primary);margin:0 0 6px;">${dpT('assign_scroll_title')}</p>
          <p style="font-size:12px;color:var(--text-muted);margin:0 0 16px;line-height:1.6;">${dpT('assign_scroll_sub')}</p>
          <button class="btn-promise" id="obReadyToLoad" style="margin-top:0;padding:11px 20px;font-size:13px;">
            ${dpT('assign_load_btn')} <span class="btn-arrow">→</span>
          </button>
        </div>

        <div class="ob-photo-legend hidden" id="obLegend">
          <div class="ob-legend-item">
            <div class="ob-legend-swatch p1-swatch">P1</div>
            <span>${this.photos.photo1 ? dpT('assign_photo1_legend') : dpT('upload_photo1_label')}</span>
          </div>
          <div class="ob-legend-item">
            <div class="ob-legend-swatch p2-swatch">P2</div>
            <span>${this.photos.photo2 ? dpT('assign_photo2_legend') : dpT('upload_photo2_label')}</span>
          </div>
        </div>

        <div class="ob-contacts-loading hidden" id="obContactsLoader">
          <div class="spinner"></div>
          <span>${dpT('assign_loading')}</span>
        </div>

        <div class="ob-contacts-wrap hidden" id="obContactsWrap">
          <div class="ob-contacts-list" id="obContactsList"></div>
          <div class="ob-assign-counts">
            <span>P1: <strong id="obP1Count">0</strong></span>
            <span>P2: <strong id="obP2Count">0</strong></span>
          </div>
        </div>

        <div class="ob-no-contacts hidden" id="obNoContacts">
          <p>${dpT('assign_no_contacts')}</p>
          <button class="btn-secondary" id="obRetryContacts">${dpT('assign_retry')}</button>
        </div>

        <button class="btn-promise hidden" id="step6Next" disabled>
          ${dpT('assign_finish')} <span class="btn-arrow">→</span>
        </button>

        <button class="ob-skip-link" id="step6Skip">${dpT('assign_skip')}</button>
      </div>
    `;

    container.querySelector('#obReadyToLoad').addEventListener('click', () => {
      container.querySelector('#obScrollPrompt').classList.add('hidden');
      container.querySelector('#obLegend').classList.remove('hidden');
      container.querySelector('#step6Next').classList.remove('hidden');
      this.loadContacts(container);
    });

    container.querySelector('#obRetryContacts')?.addEventListener('click', () => this.loadContacts(container));

    container.querySelector('#step6Next').addEventListener('click', () => {
      this.saveRulesToStorage();
      this.renderStep(7);
    });

    container.querySelector('#step6Skip').addEventListener('click', () => this.renderStep(7));
  }

  async loadContacts(container) {
    const loader = container.querySelector('#obContactsLoader');
    const wrap = container.querySelector('#obContactsWrap');
    const noContacts = container.querySelector('#obNoContacts');

    loader.classList.remove('hidden');
    wrap.classList.add('hidden');
    noContacts.classList.add('hidden');

    try {
      const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
      if (tabs.length === 0) {
        loader.classList.add('hidden');
        noContacts.classList.remove('hidden');
        return;
      }
      const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_WHATSAPP_CONTACTS' });
      loader.classList.add('hidden');
      if (response?.contacts?.length > 0) {
        this.waContacts = response.contacts;
        wrap.classList.remove('hidden');
        this.renderContactList(container);
      } else {
        noContacts.classList.remove('hidden');
      }
    } catch (err) {
      loader.classList.add('hidden');
      noContacts.classList.remove('hidden');
    }
  }

  renderContactList(container) {
    const list = container.querySelector('#obContactsList');
    if (!list) return;

    list.innerHTML = this.waContacts.slice(0, 20).map(c => {
      const isP1 = this.assignedContacts.photo1.includes(c.name);
      const isP2 = this.assignedContacts.photo2.includes(c.name);
      const initials = c.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      const avatarHtml = c.avatar
        ? `<img src="${c.avatar}" alt="${c.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
        : `<div class="ob-av-placeholder">${initials}</div>`;
      return `
        <div class="ob-contact-row ${isP1 ? 'row-p1' : ''} ${isP2 ? 'row-p2' : ''}" data-name="${c.name}">
          <div class="ob-av">${avatarHtml}</div>
          <div class="ob-contact-name">${c.name}</div>
          <div class="ob-assign-btns">
            <button class="ob-p-btn ${isP1 ? 'ob-p1-active' : ''}" data-photo="1">P1</button>
            <button class="ob-p-btn ${isP2 ? 'ob-p2-active' : ''}" data-photo="2">P2</button>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.ob-contact-row').forEach(row => {
      const name = row.dataset.name;
      row.querySelectorAll('.ob-p-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const photo = btn.dataset.photo === '1' ? 'photo1' : 'photo2';
          const success = this.toggleAssignment(name, photo);
          this.renderContactList(container);
          this.updateStep6Button(container);
          if (!success) this.showFreeLimit(container);
        });
      });
    });
    this.updateCounts(container);
  }

  toggleAssignment(name, photo) {
    const alreadyThis = this.assignedContacts[photo].includes(name);
    const alreadyAnywhere = this.assignedContacts.photo1.includes(name) || this.assignedContacts.photo2.includes(name);
    this.assignedContacts.photo1 = this.assignedContacts.photo1.filter(n => n !== name);
    this.assignedContacts.photo2 = this.assignedContacts.photo2.filter(n => n !== name);
    if (alreadyThis) return true;
    const total = this.assignedContacts.photo1.length + this.assignedContacts.photo2.length;
    if (!alreadyAnywhere && total >= DualProfileOnboarding.FREE_TIER_LIMIT) return false;
    this.assignedContacts[photo].push(name);
    return true;
  }

  updateStep6Button(container) {
    const btn = container.querySelector('#step6Next');
    if (!btn) return;
    const total = this.assignedContacts.photo1.length + this.assignedContacts.photo2.length;
    btn.disabled = total < 1;
  }

  updateCounts(container) {
    const p1 = container.querySelector('#obP1Count');
    const p2 = container.querySelector('#obP2Count');
    if (p1) p1.textContent = this.assignedContacts.photo1.length;
    if (p2) p2.textContent = this.assignedContacts.photo2.length;
  }

  showFreeLimit(container) {
    const existing = container.querySelector('.ob-limit-msg');
    if (existing) existing.remove();
    const msg = document.createElement('div');
    msg.className = 'ob-limit-msg';
    msg.innerHTML = `
      <span>${dpT('assign_free_limit')} ${DualProfileOnboarding.FREE_TIER_LIMIT} ${dpT('assign_free_contacts')}</span>
      <button class="ob-upgrade-link" id="obLimitUpgrade">${dpT('assign_upgrade')}</button>
    `;
    const wrap = container.querySelector('#obContactsWrap');
    if (wrap) wrap.after(msg);
    msg.querySelector('#obLimitUpgrade').addEventListener('click', () => {
      // showUpgradeModal is defined in popup.js scope and not accessible here.
      // Directly open the Lemon Squeezy checkout in a new tab instead.
      const checkoutUrl = typeof DualProfileConfig !== 'undefined' ? DualProfileConfig.getCheckoutUrl() : null;
      if (checkoutUrl) {
        chrome.tabs.create({ url: checkoutUrl });
      }
    });
    setTimeout(() => { msg.style.opacity = '0'; setTimeout(() => msg.remove(), 300); }, 5000);
  }

  async saveRulesToStorage() {
    // Save all assignments locally first (fast path)
    const localPromises = [
      ...this.assignedContacts.photo1.map(n => DualProfileStorage.assignContact(n, 1)),
      ...this.assignedContacts.photo2.map(n => DualProfileStorage.assignContact(n, 2)),
    ];
    await Promise.all(localPromises);

    // Fix B: Sync assignments to Convex. ASSIGN_CONTACT is local-only.
    // Without this, contacts assigned during onboarding never reach Convex —
    // the other device always gets null. User had to re-assign manually from popup.
    try {
      const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
      if (tabs.length === 0) return;
      const response = await chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_WHATSAPP_CONTACTS' });
      const contacts = (response && response.contacts) ? response.contacts : [];
      const phoneMap = {};
      contacts.forEach(c => { if (c.name && c.phone) phoneMap[c.name] = c.phone; });

      const allAssigned = [
        ...this.assignedContacts.photo1.map(n => ({ name: n, photoNumber: 1 })),
        ...this.assignedContacts.photo2.map(n => ({ name: n, photoNumber: 2 })),
      ];
      for (const { name, photoNumber } of allAssigned) {
        const phone = phoneMap[name];
        if (!phone) continue;
        try {
          await DualProfileStorage.sendMessage('SYNC_ASSIGNMENT', {
            contactName: name,
            contactPhone: phone,
            photoNumber,
          });
        } catch(_) {}
      }
    } catch(_) {}
  }

  // ─────────────────────────────────────────────────────────
  // STEP 7 — You're Live: Land the dream. Introduce network effect.
  // ─────────────────────────────────────────────────────────
  async renderYoureLive(container) {
    const c1 = this.assignedContacts.photo1[0];
    const c2 = this.assignedContacts.photo2[0];
    const anyAssigned = c1 || c2;

    if (!this.photos.photo1 && !this.photos.photo2) {
      try {
        const stored = await new Promise(resolve => {
          chrome.storage.local.get('state', data => resolve(data?.state?.photos || {}));
        });
        if (stored.photo1) this.photos.photo1 = stored.photo1;
        if (stored.photo2) this.photos.photo2 = stored.photo2;
      } catch(e) {}
    }

    let phoneRegistered = false;
    try {
      const sd = await new Promise(r => chrome.storage.local.get('myPhoneHash', r));
      phoneRegistered = !!sd.myPhoneHash;
    } catch(e) {}

    const makeAvatar = (photo, label) => {
      if (photo) return `<img src="${photo}" alt="" style="display:block;width:40px;height:40px;min-width:40px;min-height:40px;object-fit:cover;object-position:center;border-radius:50%;flex-shrink:0;">`;
      return `<div class="ob-av-placeholder" style="font-size:11px">${label}</div>`;
    };

    container.innerHTML = `
      <div class="ob-step ob-live">
        <div class="ob-live-badge">${phoneRegistered ? dpT('live_badge_active') : dpT('live_badge_almost')}</div>

        <h2 class="ob-title">
          ${phoneRegistered
            ? dpT('live_title_full')
            : dpT('live_title_almost')}
        </h2>

        ${anyAssigned ? `
          <div class="ob-live-preview">
            <div class="ob-live-contact">
              <div class="ob-live-av ob-av-ring">${makeAvatar(this.photos.photo1, 'P1')}</div>
              <div class="ob-live-info">
                <div class="ob-live-name">${c1 || c2}</div>
                <div class="ob-live-status">${c1 ? dpT('live_will_see_p1') : dpT('live_will_see_p2')}</div>
              </div>
            </div>
            ${c1 && c2 ? `
            <div class="ob-live-contact">
              <div class="ob-live-av ob-av-ring">${makeAvatar(this.photos.photo2, 'P2')}</div>
              <div class="ob-live-info">
                <div class="ob-live-name">${c2}</div>
                <div class="ob-live-status">${dpT('live_will_see_p2')}</div>
              </div>
            </div>` : ''}
          </div>
        ` : `<p class="ob-sub">${dpT('live_no_assign')}</p>`}

        <div class="ob-live-checks">
          <div class="ob-check-row"><span class="ob-check">✓</span> ${dpT('live_check_photos')}</div>
          ${phoneRegistered
            ? `<div class="ob-check-row"><span class="ob-check">✓</span> ${dpT('live_check_registered')}</div>`
            : `<div class="ob-check-row ob-check-warn"><span class="ob-check ob-check-x">!</span><span>${dpT('live_check_not_registered')} <button class="ob-fix-inline" id="ob-fix-phone">${dpT('live_fix_this')}</button></span></div><div class="ob-warn-detail">${dpT('live_warn_detail')}</div>`
          }
          <div class="ob-check-row"><span class="ob-check">${phoneRegistered ? '✓' : '~'}</span> ${phoneRegistered ? dpT('live_fully_active') : dpT('live_partly_active')}</div>
        </div>

        <div class="ob-live-nudge">
          <span>${dpT('live_nudge')}</span>
          <button class="ob-upgrade-link" id="liveUpgrade">${dpT('live_upgrade')}</button>
        </div>

        <!-- Network effect — communicated clearly, not as an afterthought -->
        <div class="ob-network-callout">
          <div class="ob-network-callout-title">${dpT('live_network_title')}</div>
          <p>${dpT('live_network_body')}</p>
          <button class="ob-copy-link-btn" id="obCopyLinkLive">${dpT('live_copy_link')}</button>
          <div class="ob-copy-confirm hidden" id="obCopyConfirmLive">${dpT('live_copied')}</div>
        </div>

        <button class="btn-promise" id="step7Next">
          ${dpT('live_continue')} <span class="btn-arrow">→</span>
        </button>
      </div>
    `;

    container.querySelector('#liveUpgrade').addEventListener('click', () => {
      const checkoutUrl = typeof DualProfileConfig !== 'undefined' ? DualProfileConfig.getCheckoutUrl() : null;
      if (checkoutUrl) {
        chrome.tabs.create({ url: checkoutUrl });
      }
    });

    const fixPhoneBtn = container.querySelector('#ob-fix-phone');
    if (fixPhoneBtn) {
      fixPhoneBtn.addEventListener('click', () => {
        this.returnAfterPhone = true;
        this.renderStep(4);
      });
    }

    container.querySelector('#obCopyLinkLive').addEventListener('click', () => {
      const url = 'https://chromewebstore.google.com/detail/dualprofile/mdlhdncmaeepcejdbpnjpjlmagmmpkpc';
      navigator.clipboard.writeText(url).catch(() => {});
      const confirm = container.querySelector('#obCopyConfirmLive');
      confirm.classList.remove('hidden');
      setTimeout(() => confirm.classList.add('hidden'), 3000);
    });

    container.querySelector('#step7Next').addEventListener('click', () => {
      this.finishOnboarding();
      chrome.tabs.query({ url: 'https://web.whatsapp.com/*' }, tabs => {
        if (tabs.length > 0) {
          chrome.tabs.update(tabs[0].id, { active: true });
        } else {
          chrome.tabs.create({ url: 'https://web.whatsapp.com' });
        }
      });
    });
  }


  finishOnboarding() {
    this.completeOnboarding();
    this.modal.classList.remove('visible');
    setTimeout(() => {
      this.modal.remove();
      location.reload();
    }, 300);
  }

  getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }
}

window.DualProfileOnboarding = DualProfileOnboarding;
