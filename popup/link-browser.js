/**
 * DualProfile — "Link this browser" (C1b)
 *
 * Draws the link section in Settings. It is deliberately self-contained: it
 * reads nothing from popup.js and popup.js reads nothing from it, so it cannot
 * disturb photos, contacts, scheduling or the phone number form.
 *
 * All decisions are made in the service worker (lib/sync-manager.js:
 * getLinkInfo, getLinkCode, linkWithCode). This file only shows the result.
 *
 * States, from GET_LINK_INFO:
 *   no phone number saved          section hidden
 *   needsLink                      warning + box to paste a code
 *   canShowCode                    button that reveals this account's code
 *   linked, keyState 'foreign'     note: get the code from the first browser
 *   linked, keyState 'pending'     note: code not ready yet
 *
 * Every string goes into the page with textContent. Nothing here builds HTML.
 */
(function () {
  'use strict';

  var STR = {
    en: {
      title_other: 'Link another browser',
      title_this: 'Link this browser',
      desc_show: 'Using DualProfile with this number in another browser, or setting it up again after a reinstall? Show the link code here and paste it there.',
      btn_show: 'Show link code',
      btn_hide: 'Hide code',
      btn_copy: 'Copy',
      copied: 'Copied',
      warn_code: 'Anyone with this code can join your DualProfile account. Use it only in your own browsers, and keep a copy somewhere safe.',
      alert_needs: 'This number is already set up in another browser. Until this browser is linked, photos shared between you and your contacts will not update here.',
      desc_enter: 'Open DualProfile in the browser you set up first, go to Settings, choose "Show link code", then paste the code below.',
      label_code: 'Link code',
      btn_link: 'Link this browser',
      linking: 'Linking...',
      ok_linked: 'Linked. Refresh WhatsApp Web to see shared photos.',
      desc_foreign: 'This browser is linked. To link another one, use the link code from the browser you set up first.',
      desc_pending: 'Your link code is not ready yet. Close this window and open it again in a moment.',
      err_INVALID_CODE: 'That is not a link code. Copy it again from the other browser.',
      err_WRONG_CODE: 'That code does not belong to this number. Check that both browsers use the same WhatsApp number.',
      err_NO_PHONE: 'Save your WhatsApp number first.',
      err_NETWORK: 'Could not reach DualProfile. Check your connection and try again.',
      err_SERVER_NOT_READY: 'Linking is not available yet. Please try again later.',
      err_NO_CODE_HERE: 'This browser has no link code to show.'
    },
    es: {
      title_other: 'Vincular otro navegador',
      title_this: 'Vincular este navegador',
      desc_show: '¿Usas DualProfile con este número en otro navegador, o lo estás configurando de nuevo tras reinstalarlo? Muestra aquí el código de vinculación y pégalo allí.',
      btn_show: 'Mostrar código de vinculación',
      btn_hide: 'Ocultar código',
      btn_copy: 'Copiar',
      copied: 'Copiado',
      warn_code: 'Cualquiera que tenga este código puede unirse a tu cuenta de DualProfile. Úsalo solo en tus propios navegadores y guarda una copia en un lugar seguro.',
      alert_needs: 'Este número ya está configurado en otro navegador. Hasta que vincules este navegador, las fotos compartidas entre tú y tus contactos no se actualizarán aquí.',
      desc_enter: 'Abre DualProfile en el navegador que configuraste primero, ve a Ajustes, elige "Mostrar código de vinculación" y pega el código abajo.',
      label_code: 'Código de vinculación',
      btn_link: 'Vincular este navegador',
      linking: 'Vinculando...',
      ok_linked: 'Vinculado. Actualiza WhatsApp Web para ver las fotos compartidas.',
      desc_foreign: 'Este navegador está vinculado. Para vincular otro, usa el código de vinculación del navegador que configuraste primero.',
      desc_pending: 'Tu código de vinculación aún no está listo. Cierra esta ventana y ábrela de nuevo en un momento.',
      err_INVALID_CODE: 'Eso no es un código de vinculación. Cópialo de nuevo desde el otro navegador.',
      err_WRONG_CODE: 'Ese código no pertenece a este número. Comprueba que ambos navegadores usan el mismo número de WhatsApp.',
      err_NO_PHONE: 'Primero guarda tu número de WhatsApp.',
      err_NETWORK: 'No se pudo conectar con DualProfile. Revisa tu conexión e inténtalo de nuevo.',
      err_SERVER_NOT_READY: 'La vinculación aún no está disponible. Inténtalo más tarde.',
      err_NO_CODE_HERE: 'Este navegador no tiene un código de vinculación que mostrar.'
    },
    zh: {
      title_other: '关联其他浏览器',
      title_this: '关联此浏览器',
      desc_show: '想在另一个浏览器中用这个号码使用 DualProfile，或在重新安装后重新设置？在这里显示关联码，然后粘贴到那边。',
      btn_show: '显示关联码',
      btn_hide: '隐藏关联码',
      btn_copy: '复制',
      copied: '已复制',
      warn_code: '任何拥有此关联码的人都可以加入你的 DualProfile 账户。请只在你自己的浏览器中使用，并妥善保存一份。',
      alert_needs: '此号码已在另一个浏览器中设置。在关联此浏览器之前，你与联系人之间共享的照片不会在这里更新。',
      desc_enter: '在你最先设置的浏览器中打开 DualProfile，进入“设置”，选择“显示关联码”，然后把关联码粘贴到下面。',
      label_code: '关联码',
      btn_link: '关联此浏览器',
      linking: '正在关联...',
      ok_linked: '已关联。刷新 WhatsApp Web 即可看到共享的照片。',
      desc_foreign: '此浏览器已关联。要关联其他浏览器，请使用你最先设置的那个浏览器中的关联码。',
      desc_pending: '你的关联码尚未准备好。请关闭此窗口，稍后再打开。',
      err_INVALID_CODE: '这不是关联码。请从另一个浏览器重新复制。',
      err_WRONG_CODE: '该关联码不属于这个号码。请确认两个浏览器使用的是同一个 WhatsApp 号码。',
      err_NO_PHONE: '请先保存你的 WhatsApp 号码。',
      err_NETWORK: '无法连接到 DualProfile。请检查网络后重试。',
      err_SERVER_NOT_READY: '关联功能暂不可用。请稍后再试。',
      err_NO_CODE_HERE: '此浏览器没有可显示的关联码。'
    },
    ja: {
      title_other: '別のブラウザをリンク',
      title_this: 'このブラウザをリンク',
      desc_show: '別のブラウザでこの番号の DualProfile を使う場合や、再インストール後に設定し直す場合は、ここでリンクコードを表示して、そちらに貼り付けてください。',
      btn_show: 'リンクコードを表示',
      btn_hide: 'コードを隠す',
      btn_copy: 'コピー',
      copied: 'コピーしました',
      warn_code: 'このコードを持つ人は誰でもあなたの DualProfile アカウントに参加できます。自分のブラウザでのみ使用し、控えを安全な場所に保管してください。',
      alert_needs: 'この番号はすでに別のブラウザで設定されています。このブラウザをリンクするまで、連絡先と共有している写真はここでは更新されません。',
      desc_enter: '最初に設定したブラウザで DualProfile を開き、「設定」で「リンクコードを表示」を選んで、コードを下に貼り付けてください。',
      label_code: 'リンクコード',
      btn_link: 'このブラウザをリンク',
      linking: 'リンク中...',
      ok_linked: 'リンクしました。WhatsApp Web を再読み込みすると共有写真が表示されます。',
      desc_foreign: 'このブラウザはリンク済みです。別のブラウザをリンクするには、最初に設定したブラウザのリンクコードを使ってください。',
      desc_pending: 'リンクコードはまだ準備できていません。このウィンドウを閉じて、少ししてからもう一度開いてください。',
      err_INVALID_CODE: 'これはリンクコードではありません。もう一方のブラウザからコピーし直してください。',
      err_WRONG_CODE: 'このコードはこの番号のものではありません。両方のブラウザで同じ WhatsApp 番号を使っているか確認してください。',
      err_NO_PHONE: '先に WhatsApp の番号を保存してください。',
      err_NETWORK: 'DualProfile に接続できませんでした。接続を確認して、もう一度お試しください。',
      err_SERVER_NOT_READY: 'リンク機能はまだ利用できません。後でもう一度お試しください。',
      err_NO_CODE_HERE: 'このブラウザには表示できるリンクコードがありません。'
    },
    fr: {
      title_other: 'Associer un autre navigateur',
      title_this: 'Associer ce navigateur',
      desc_show: 'Vous utilisez DualProfile avec ce numéro dans un autre navigateur, ou vous le reconfigurez après une réinstallation ? Affichez le code d\'association ici et collez-le là-bas.',
      btn_show: 'Afficher le code d\'association',
      btn_hide: 'Masquer le code',
      btn_copy: 'Copier',
      copied: 'Copié',
      warn_code: 'Toute personne disposant de ce code peut rejoindre votre compte DualProfile. Utilisez-le uniquement dans vos propres navigateurs et gardez-en une copie en lieu sûr.',
      alert_needs: 'Ce numéro est déjà configuré dans un autre navigateur. Tant que ce navigateur n\'est pas associé, les photos partagées entre vous et vos contacts ne seront pas mises à jour ici.',
      desc_enter: 'Ouvrez DualProfile dans le navigateur que vous avez configuré en premier, allez dans Paramètres, choisissez « Afficher le code d\'association », puis collez le code ci-dessous.',
      label_code: 'Code d\'association',
      btn_link: 'Associer ce navigateur',
      linking: 'Association...',
      ok_linked: 'Associé. Actualisez WhatsApp Web pour voir les photos partagées.',
      desc_foreign: 'Ce navigateur est associé. Pour en associer un autre, utilisez le code d\'association du navigateur que vous avez configuré en premier.',
      desc_pending: 'Votre code d\'association n\'est pas encore prêt. Fermez cette fenêtre et rouvrez-la dans un instant.',
      err_INVALID_CODE: 'Ce n\'est pas un code d\'association. Copiez-le à nouveau depuis l\'autre navigateur.',
      err_WRONG_CODE: 'Ce code ne correspond pas à ce numéro. Vérifiez que les deux navigateurs utilisent le même numéro WhatsApp.',
      err_NO_PHONE: 'Enregistrez d\'abord votre numéro WhatsApp.',
      err_NETWORK: 'Impossible de joindre DualProfile. Vérifiez votre connexion et réessayez.',
      err_SERVER_NOT_READY: 'L\'association n\'est pas encore disponible. Veuillez réessayer plus tard.',
      err_NO_CODE_HERE: 'Ce navigateur n\'a pas de code d\'association à afficher.'
    },
    pt: {
      title_other: 'Vincular outro navegador',
      title_this: 'Vincular este navegador',
      desc_show: 'Vai usar o DualProfile com este número em outro navegador, ou está configurando de novo após reinstalar? Mostre o código de vinculação aqui e cole lá.',
      btn_show: 'Mostrar código de vinculação',
      btn_hide: 'Ocultar código',
      btn_copy: 'Copiar',
      copied: 'Copiado',
      warn_code: 'Qualquer pessoa com este código pode entrar na sua conta do DualProfile. Use-o apenas nos seus próprios navegadores e guarde uma cópia em local seguro.',
      alert_needs: 'Este número já está configurado em outro navegador. Até este navegador ser vinculado, as fotos compartilhadas entre você e seus contatos não serão atualizadas aqui.',
      desc_enter: 'Abra o DualProfile no navegador que você configurou primeiro, vá em Configurações, escolha "Mostrar código de vinculação" e cole o código abaixo.',
      label_code: 'Código de vinculação',
      btn_link: 'Vincular este navegador',
      linking: 'Vinculando...',
      ok_linked: 'Vinculado. Atualize o WhatsApp Web para ver as fotos compartilhadas.',
      desc_foreign: 'Este navegador está vinculado. Para vincular outro, use o código de vinculação do navegador que você configurou primeiro.',
      desc_pending: 'Seu código de vinculação ainda não está pronto. Feche esta janela e abra-a novamente em instantes.',
      err_INVALID_CODE: 'Isso não é um código de vinculação. Copie-o novamente do outro navegador.',
      err_WRONG_CODE: 'Esse código não pertence a este número. Verifique se os dois navegadores usam o mesmo número de WhatsApp.',
      err_NO_PHONE: 'Salve primeiro o seu número de WhatsApp.',
      err_NETWORK: 'Não foi possível conectar ao DualProfile. Verifique sua conexão e tente novamente.',
      err_SERVER_NOT_READY: 'A vinculação ainda não está disponível. Tente novamente mais tarde.',
      err_NO_CODE_HERE: 'Este navegador não tem um código de vinculação para mostrar.'
    },
    de: {
      title_other: 'Weiteren Browser verknüpfen',
      title_this: 'Diesen Browser verknüpfen',
      desc_show: 'Du nutzt DualProfile mit dieser Nummer in einem anderen Browser oder richtest es nach einer Neuinstallation erneut ein? Zeige hier den Verknüpfungscode an und füge ihn dort ein.',
      btn_show: 'Verknüpfungscode anzeigen',
      btn_hide: 'Code ausblenden',
      btn_copy: 'Kopieren',
      copied: 'Kopiert',
      warn_code: 'Jeder, der diesen Code hat, kann deinem DualProfile-Konto beitreten. Verwende ihn nur in deinen eigenen Browsern und bewahre eine Kopie sicher auf.',
      alert_needs: 'Diese Nummer ist bereits in einem anderen Browser eingerichtet. Solange dieser Browser nicht verknüpft ist, werden Fotos, die du mit deinen Kontakten teilst, hier nicht aktualisiert.',
      desc_enter: 'Öffne DualProfile in dem Browser, den du zuerst eingerichtet hast, gehe zu Einstellungen, wähle „Verknüpfungscode anzeigen“ und füge den Code unten ein.',
      label_code: 'Verknüpfungscode',
      btn_link: 'Diesen Browser verknüpfen',
      linking: 'Wird verknüpft...',
      ok_linked: 'Verknüpft. Aktualisiere WhatsApp Web, um geteilte Fotos zu sehen.',
      desc_foreign: 'Dieser Browser ist verknüpft. Um einen weiteren zu verknüpfen, verwende den Verknüpfungscode aus dem Browser, den du zuerst eingerichtet hast.',
      desc_pending: 'Dein Verknüpfungscode ist noch nicht bereit. Schließe dieses Fenster und öffne es gleich noch einmal.',
      err_INVALID_CODE: 'Das ist kein Verknüpfungscode. Kopiere ihn noch einmal aus dem anderen Browser.',
      err_WRONG_CODE: 'Dieser Code gehört nicht zu dieser Nummer. Prüfe, ob beide Browser dieselbe WhatsApp-Nummer verwenden.',
      err_NO_PHONE: 'Speichere zuerst deine WhatsApp-Nummer.',
      err_NETWORK: 'DualProfile ist nicht erreichbar. Prüfe deine Verbindung und versuche es erneut.',
      err_SERVER_NOT_READY: 'Das Verknüpfen ist noch nicht verfügbar. Bitte versuche es später erneut.',
      err_NO_CODE_HERE: 'Dieser Browser hat keinen Verknüpfungscode zum Anzeigen.'
    },
    hi: {
      title_other: 'दूसरा ब्राउज़र लिंक करें',
      title_this: 'इस ब्राउज़र को लिंक करें',
      desc_show: 'क्या आप इस नंबर के साथ DualProfile किसी दूसरे ब्राउज़र में इस्तेमाल कर रहे हैं, या दोबारा इंस्टॉल करने के बाद इसे फिर से सेट कर रहे हैं? यहाँ लिंक कोड दिखाएँ और उसे वहाँ पेस्ट करें।',
      btn_show: 'लिंक कोड दिखाएँ',
      btn_hide: 'कोड छिपाएँ',
      btn_copy: 'कॉपी करें',
      copied: 'कॉपी हो गया',
      warn_code: 'जिसके पास भी यह कोड है, वह आपके DualProfile खाते से जुड़ सकता है। इसे केवल अपने ब्राउज़रों में इस्तेमाल करें और एक कॉपी सुरक्षित जगह पर रखें।',
      alert_needs: 'यह नंबर पहले से किसी दूसरे ब्राउज़र में सेट है। जब तक यह ब्राउज़र लिंक नहीं होता, आपके और आपके संपर्कों के बीच साझा की गई फ़ोटो यहाँ अपडेट नहीं होंगी।',
      desc_enter: 'जिस ब्राउज़र में आपने सबसे पहले सेटअप किया था, उसमें DualProfile खोलें, सेटिंग्स में जाएँ, "लिंक कोड दिखाएँ" चुनें, फिर कोड नीचे पेस्ट करें।',
      label_code: 'लिंक कोड',
      btn_link: 'इस ब्राउज़र को लिंक करें',
      linking: 'लिंक हो रहा है...',
      ok_linked: 'लिंक हो गया। साझा की गई फ़ोटो देखने के लिए WhatsApp Web रीफ़्रेश करें।',
      desc_foreign: 'यह ब्राउज़र लिंक है। दूसरा ब्राउज़र लिंक करने के लिए, उस ब्राउज़र का लिंक कोड इस्तेमाल करें जिसमें आपने सबसे पहले सेटअप किया था।',
      desc_pending: 'आपका लिंक कोड अभी तैयार नहीं है। यह विंडो बंद करें और थोड़ी देर में फिर खोलें।',
      err_INVALID_CODE: 'यह लिंक कोड नहीं है। इसे दूसरे ब्राउज़र से फिर से कॉपी करें।',
      err_WRONG_CODE: 'यह कोड इस नंबर का नहीं है। जाँच लें कि दोनों ब्राउज़र एक ही WhatsApp नंबर इस्तेमाल कर रहे हैं।',
      err_NO_PHONE: 'पहले अपना WhatsApp नंबर सेव करें।',
      err_NETWORK: 'DualProfile से संपर्क नहीं हो सका। अपना कनेक्शन जाँचें और फिर कोशिश करें।',
      err_SERVER_NOT_READY: 'लिंक करना अभी उपलब्ध नहीं है। कृपया बाद में फिर कोशिश करें।',
      err_NO_CODE_HERE: 'इस ब्राउज़र के पास दिखाने के लिए कोई लिंक कोड नहीं है।'
    },
    ru: {
      title_other: 'Привязать другой браузер',
      title_this: 'Привязать этот браузер',
      desc_show: 'Используете DualProfile с этим номером в другом браузере или настраиваете его заново после переустановки? Покажите код привязки здесь и вставьте его там.',
      btn_show: 'Показать код привязки',
      btn_hide: 'Скрыть код',
      btn_copy: 'Копировать',
      copied: 'Скопировано',
      warn_code: 'Любой, у кого есть этот код, может войти в ваш аккаунт DualProfile. Используйте его только в своих браузерах и сохраните копию в надёжном месте.',
      alert_needs: 'Этот номер уже настроен в другом браузере. Пока этот браузер не привязан, фото, которыми вы обмениваетесь с контактами, здесь обновляться не будут.',
      desc_enter: 'Откройте DualProfile в браузере, который вы настроили первым, перейдите в «Настройки», выберите «Показать код привязки» и вставьте код ниже.',
      label_code: 'Код привязки',
      btn_link: 'Привязать этот браузер',
      linking: 'Привязка...',
      ok_linked: 'Привязано. Обновите WhatsApp Web, чтобы увидеть общие фото.',
      desc_foreign: 'Этот браузер привязан. Чтобы привязать ещё один, используйте код привязки из браузера, который вы настроили первым.',
      desc_pending: 'Ваш код привязки ещё не готов. Закройте это окно и откройте его снова через минуту.',
      err_INVALID_CODE: 'Это не код привязки. Скопируйте его ещё раз из другого браузера.',
      err_WRONG_CODE: 'Этот код не относится к этому номеру. Проверьте, что в обоих браузерах используется один и тот же номер WhatsApp.',
      err_NO_PHONE: 'Сначала сохраните свой номер WhatsApp.',
      err_NETWORK: 'Не удалось связаться с DualProfile. Проверьте подключение и повторите попытку.',
      err_SERVER_NOT_READY: 'Привязка пока недоступна. Повторите попытку позже.',
      err_NO_CODE_HERE: 'В этом браузере нет кода привязки.'
    }
  };

  function lang() {
    try {
      if (typeof dpGetLang === 'function') return dpGetLang();
    } catch (e) {}
    return 'en';
  }

  function t(key) {
    var table = STR[lang()] || STR.en;
    return table[key] || STR.en[key] || key;
  }

  function send(type, data) {
    return new Promise(function (resolve) {
      try {
        chrome.runtime.sendMessage(Object.assign({ type: type }, data || {}), function (res) {
          if (chrome.runtime && chrome.runtime.lastError) return resolve({ success: false, error: 'NETWORK' });
          resolve(res || { success: false, error: 'NETWORK' });
        });
      } catch (e) {
        resolve({ success: false, error: 'NETWORK' });
      }
    });
  }

  var el = {};
  var codeShown = false;
  var busy = false;
  var justLinked = false;

  function grab() {
    var ids = [
      'linkBrowserSection', 'linkTitle', 'linkAlert', 'linkDesc', 'linkShowBlock', 'linkShowBtn',
      'linkCodeBox', 'linkCodeText', 'linkCopyBtn', 'linkWarning', 'linkEnterBlock',
      'linkInputLabel', 'linkCodeInput', 'linkSubmitBtn', 'linkStatus'
    ];
    for (var i = 0; i < ids.length; i++) el[ids[i]] = document.getElementById(ids[i]);
    return !!el.linkBrowserSection;
  }

  function show(node, on) {
    if (node) node.hidden = !on;
  }

  function setStatus(kind, text) {
    if (!el.linkStatus) return;
    el.linkStatus.textContent = text || '';
    el.linkStatus.className = 'link-status' + (kind ? ' link-status-' + kind : '');
    show(el.linkStatus, !!text);
  }

  function hideCode() {
    codeShown = false;
    if (el.linkCodeText) el.linkCodeText.textContent = '';
    show(el.linkCodeBox, false);
    show(el.linkWarning, false);
    if (el.linkShowBtn) el.linkShowBtn.textContent = t('btn_show');
  }

  async function render(refresh) {
    if (!el.linkBrowserSection) return;
    var info = await send('GET_LINK_INFO', { refresh: !!refresh });

    // Nothing to link until a phone number is saved, and nothing to show if
    // the service worker could not answer.
    if (!info || !info.success || !info.phoneSet) {
      show(el.linkBrowserSection, false);
      return;
    }
    show(el.linkBrowserSection, true);
    el.linkBrowserSection.setAttribute('data-link-state',
      info.needsLink ? 'needs-link' : (info.canShowCode ? 'can-show' : info.keyState));

    el.linkTitle.textContent = info.needsLink ? t('title_this') : t('title_other');

    // This browser needs a code.
    show(el.linkAlert, !!info.needsLink);
    el.linkAlert.textContent = info.needsLink ? t('alert_needs') : '';
    show(el.linkEnterBlock, !!info.needsLink);
    if (info.needsLink) {
      el.linkDesc.textContent = t('desc_enter');
      el.linkInputLabel.textContent = t('label_code');
      if (!busy) el.linkSubmitBtn.textContent = t('btn_link');
      show(el.linkShowBlock, false);
      hideCode();
      return;
    }

    // This browser is linked.
    if (info.canShowCode) {
      el.linkDesc.textContent = t('desc_show');
      show(el.linkShowBlock, true);
      if (!codeShown) el.linkShowBtn.textContent = t('btn_show');
      el.linkCopyBtn.textContent = t('btn_copy');
      el.linkWarning.textContent = t('warn_code');
    } else {
      el.linkDesc.textContent = info.keyState === 'foreign' ? t('desc_foreign') : t('desc_pending');
      show(el.linkShowBlock, false);
      hideCode();
    }
    if (!justLinked) setStatus('', '');
  }

  async function onShowClick() {
    if (codeShown) { hideCode(); return; }
    var res = await send('GET_LINK_CODE');
    if (!res || !res.success || !res.code) {
      setStatus('error', t('err_' + ((res && res.error) || 'NO_CODE_HERE')));
      return;
    }
    setStatus('', '');
    codeShown = true;
    el.linkCodeText.textContent = res.code;
    show(el.linkCodeBox, true);
    show(el.linkWarning, true);
    el.linkShowBtn.textContent = t('btn_hide');
  }

  async function onCopyClick() {
    var text = el.linkCodeText ? el.linkCodeText.textContent : '';
    if (!text) return;
    var done = false;
    try {
      await navigator.clipboard.writeText(text);
      done = true;
    } catch (e) {
      // Clipboard blocked: select the code so Ctrl+C works.
      try {
        var range = document.createRange();
        range.selectNodeContents(el.linkCodeText);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e2) {}
    }
    if (done) {
      el.linkCopyBtn.textContent = t('copied');
      setTimeout(function () { if (el.linkCopyBtn) el.linkCopyBtn.textContent = t('btn_copy'); }, 1500);
    }
  }

  async function onSubmitClick() {
    if (busy) return;
    busy = true;
    justLinked = false;
    el.linkSubmitBtn.disabled = true;
    el.linkSubmitBtn.textContent = t('linking');
    setStatus('', '');
    var res = await send('LINK_BROWSER', { code: el.linkCodeInput.value });
    busy = false;
    el.linkSubmitBtn.disabled = false;
    el.linkSubmitBtn.textContent = t('btn_link');
    if (res && res.success) {
      el.linkCodeInput.value = '';
      justLinked = true;
      await render(false);
      setStatus('success', t('ok_linked'));
      return;
    }
    var key = 'err_' + ((res && res.error) || 'NETWORK');
    setStatus('error', STR.en[key] ? t(key) : t('err_NETWORK'));
  }

  function start() {
    if (!grab()) return;
    el.linkShowBtn.addEventListener('click', onShowClick);
    el.linkCopyBtn.addEventListener('click', onCopyClick);
    el.linkSubmitBtn.addEventListener('click', onSubmitClick);

    render(true);

    // Redraw when Settings is opened, and shortly after the number is saved.
    var settingsTab = document.getElementById('settingsTab');
    if (settingsTab && typeof MutationObserver !== 'undefined') {
      new MutationObserver(function () {
        if (settingsTab.classList.contains('active')) render(false);
      }).observe(settingsTab, { attributes: true, attributeFilter: ['class'] });
    }
    var saveBtn = document.getElementById('savePhoneBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        setTimeout(function () { render(true); }, 3000);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
