/* ==========================================================================
   Better Neighbors, site behaviour.

   RULE THIS FILE OBEYS: every enhancement here is additive. Nothing on any
   page is hidden until JavaScript arrives. If this file never loads, the
   whole site still reads top to bottom. That is deliberate. The people this
   organisation serves are often on library terminals, older phones and
   locked-down machines, and a blank page is not an acceptable failure.
   ========================================================================== */

(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- nav -- */

  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', String(!open));
      burger.setAttribute('aria-expanded', String(!open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.setAttribute('data-open', 'false');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.getAttribute('data-open') === 'true') {
        nav.setAttribute('data-open', 'false');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ------------------------------------------------------ monogram draw -- */
  /* The two letterforms cross and lock. Drawing them in sequence says the
     same thing the mark says, so the motion carries meaning, not decoration. */

  var drawnAlready = false;
  try { drawnAlready = window.sessionStorage.getItem('nr-drawn') === '1'; } catch (err) { drawnAlready = false; }

  document.querySelectorAll('.draw').forEach(function (svg) {
    /* Reduced motion, or already seen this session: leave the mark solid.
       A logo that redraws on every single page view stops being a signature
       and becomes a tic. */
    if (reduced || drawnAlready) { svg.classList.remove('draw'); return; }

    svg.querySelectorAll('path').forEach(function (p) {
      var len = 0;
      try { len = p.getTotalLength(); } catch (err) { len = 900; }
      p.style.setProperty('--len', Math.ceil(len));
    });
    requestAnimationFrame(function () { svg.classList.add('go'); });
  });

  if (!reduced && !drawnAlready) {
    try { window.sessionStorage.setItem('nr-drawn', '1'); } catch (err) { /* private mode, fine */ }
  }

  /* -------------------------------------------------------- reveal ------ */

  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      reveals.forEach(function (el) { io.observe(el); });
      /* Belt and braces: anything still unrevealed after 4 seconds is shown
         anyway, so a broken observer can never leave the page blank. */
      window.setTimeout(function () {
        document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
          var box = el.getBoundingClientRect();
          if (box.top < window.innerHeight * 1.5) { el.classList.add('in'); }
        });
      }, 4000);
    }
  }

  /* ------------------------------------------------------ timeline tabs -- */

  document.querySelectorAll('[data-timeline]').forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    if (!tabs.length) { return; }

    function select(idx, focus) {
      tabs.forEach(function (tab, i) {
        var on = i === idx;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(tab.getAttribute('aria-controls'));
        if (panel) { panel.hidden = !on; }
      });
      if (focus) { tabs[idx].focus(); }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(i, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { next = (i + 1) % tabs.length; }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { next = (i - 1 + tabs.length) % tabs.length; }
        if (e.key === 'Home') { next = 0; }
        if (e.key === 'End') { next = tabs.length - 1; }
        if (next !== null) { e.preventDefault(); select(next, true); }
      });
    });

    select(0, false);
  });

  /* -------------------------------------------------------- reframe ----- */

  document.querySelectorAll('[data-reframe]').forEach(function (root) {
    var btns = root.querySelectorAll('[data-view-btn]');
    var list = root.querySelector('.reframe-list');
    var sets = {
      have: JSON.parse(root.getAttribute('data-have') || '[]'),
      lost: JSON.parse(root.getAttribute('data-lost') || '[]')
    };
    var live = root.querySelector('[data-live]');

    function show(view) {
      btns.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-view-btn') === view));
      });
      list.setAttribute('data-view', view);
      list.innerHTML = '';
      sets[view].forEach(function (text) {
        var li = document.createElement('li');
        li.textContent = text;
        list.appendChild(li);
      });
      if (live) {
        live.textContent = view === 'have'
          ? 'Showing what is still yours.'
          : 'Showing what the conditions actually take.';
      }
    }

    btns.forEach(function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-view-btn')); });
    });
    show('have');
  });

  /* ---------------------------------------------------- scam sorter ----- */
  /* Twenty seconds, one real skill, and proof the curriculum is not vapour. */

  document.querySelectorAll('[data-sorter]').forEach(function (root) {
    var cards = root.querySelectorAll('.sorter-card');
    var scoreEl = root.querySelector('[data-score]');
    var answered = 0, right = 0;

    cards.forEach(function (card) {
      var truth = card.getAttribute('data-answer');           /* scam | real */
      var why = card.getAttribute('data-why') || '';
      var btns = card.querySelectorAll('.sorter-btns button');
      var out = card.querySelector('.sorter-ans');

      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (card.getAttribute('data-done') === 'true') { return; }
          card.setAttribute('data-done', 'true');
          var pick = btn.getAttribute('data-pick');
          var correct = pick === truth;
          answered += 1;
          if (correct) { right += 1; }

          btns.forEach(function (b) { b.disabled = true; });
          out.hidden = false;
          out.setAttribute('data-verdict', correct ? 'right' : 'wrong');
          out.innerHTML = '';
          var head = document.createElement('b');
          head.textContent = correct
            ? 'Right. It is ' + (truth === 'scam' ? 'a scam.' : 'real.')
            : 'Not this time. It is ' + (truth === 'scam' ? 'a scam.' : 'real.');
          var body = document.createElement('span');
          body.textContent = why;
          out.appendChild(head);
          out.appendChild(body);

          if (scoreEl) {
            scoreEl.textContent = right + ' of ' + answered + ' called correctly.';
          }
        });
      });
    });
  });

  /* --------------------------------------------------- story form ------- */
  /* Honesty rule: this NEVER claims the message was sent. It opens the mail
     client and then says plainly what it did, and hands over the full text
     so a person with no mail client set up is not left thinking they are on
     a list they are not on. */

  var story = document.getElementById('story-form');
  if (story) {
    var anon = document.getElementById('anon');
    var idBlock = document.getElementById('identity-block');

    function syncAnon() {
      var hide = anon.checked;
      idBlock.hidden = hide;
      idBlock.querySelectorAll('input').forEach(function (i) {
        i.disabled = hide;
        if (hide) { i.value = ''; }
      });
    }
    if (anon && idBlock) { anon.addEventListener('change', syncAnon); syncAnon(); }

    /* Bound to the button's CLICK as well as the form's submit, 2026-08-18. The
       Send control is now type="button" so that a browser with scripting off
       cannot fire a native submission and write the disclosure into the URL.
       The submit listener stays for any path that still raises one. Both run
       the same handler and both cancel the default. */
    function sendStory(e) {
      if (e) { e.preventDefault(); }
      var data = new FormData(story);
      var lines = [];

      lines.push('A story submitted through the Better Neighbors website.');
      lines.push('');
      lines.push('Anonymous: ' + (data.get('anon') ? 'YES, do not record who sent this' : 'No'));
      if (!data.get('anon')) {
        lines.push('Name or handle: ' + (data.get('name') || 'not given'));
        lines.push('Reply address: ' + (data.get('email') || 'not given'));
      }
      lines.push('How long since release: ' + (data.get('since') || 'not given'));
      lines.push('Permission to publish: ' + (data.get('permission') || 'not answered'));
      lines.push('');
      lines.push('WHAT WAS HARDEST');
      lines.push(data.get('hardest') || '');
      lines.push('');
      lines.push('WHAT ACTUALLY HELPED');
      lines.push(data.get('helped') || '');
      lines.push('');
      lines.push('WHAT NOBODY TOLD THEM');
      lines.push(data.get('untold') || '');

      var body = lines.join('\n');
      var out = document.getElementById('story-result');
      var pre = document.getElementById('story-text');
      var note = document.getElementById('story-note');

      pre.value = body;
      out.hidden = false;

      /* THE ANONYMOUS BRANCH, 2026-08-31. This is the fix for a real hole.
         The page promises "anonymous means anonymous". Until today every send
         went through mailto:, which hands the message to the visitor's OWN mail
         client and posts it from their OWN address. The form fields were
         anonymous and the channel was not, so the recipient saw the real name
         and address of somebody who had just been told they could not be
         identified. It is the same shape as the consent banner that gated the
         events and not the fetch.

         Anonymous now NEVER opens a mail app. The words are handed back to the
         person and they choose what to send them from. That is the only route
         on a site with no server and no third party that can actually keep the
         promise, and the promise is the thing being kept, not the mechanism.

         Untick the box and the mail app opens as before, because at that point
         the person has asked us to know who they are. */
      var wantsAnon = !!data.get('anon');

      if (wantsAnon) {
        note.innerHTML =
          '<b>Your words are ready, and nothing has been sent.</b><br><br>' +
          'That is deliberate. Opening your email app would have put your own address ' +
          'at the top of this message, and we said you could stay anonymous. So we have ' +
          'not opened it. Copy the text below and send it from any address you like, ' +
          'including one you make up for this. Nothing you typed has left this page, and ' +
          'we will only ever see what you choose to send us.';
      } else {
        note.innerHTML =
          '<b>Your email app should have opened with this message ready to send.</b><br><br>' +
          'It is not sent until you press send in that app. If nothing opened, or you do ' +
          'not use email on this device, copy the text below and send it to us any way ' +
          'you like. We would rather tell you this plainly than show you a thank you page ' +
          'for a message that never left.';

        window.location.href = 'mailto:Robin@creatingbetterneighbors.org'
          + '?subject=' + encodeURIComponent('Better Neighbors, a story')
          + '&body=' + encodeURIComponent(body);
      }

      out.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }

    var sendBtn = document.getElementById('story-send');
    if (sendBtn) { sendBtn.addEventListener('click', sendStory); }
    story.addEventListener('submit', sendStory);

    var copyBtn = document.getElementById('story-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var pre = document.getElementById('story-text');
        pre.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        if (navigator.clipboard) {
          navigator.clipboard.writeText(pre.value).then(function () {
            copyBtn.textContent = 'Copied';
          }, function () {
            copyBtn.textContent = ok ? 'Copied' : 'Select the text above and copy it';
          });
        } else {
          copyBtn.textContent = ok ? 'Copied' : 'Select the text above and copy it';
        }
      });
    }
  }

  /* ------------------------------------------------------ current nav --- */

  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('#nav a[href]').forEach(function (a) {
    var target = a.getAttribute('href').split('/').pop().toLowerCase();
    if (target === here) { a.setAttribute('aria-current', 'page'); }
  });
})();

/* ======================================================================= */
/* MOTION LAYER                                           added 2026-08-17 */
/* ======================================================================= */
/* Everything here is additive. If this whole block threw on line one, the
   page would still read, still navigate and still submit. That is the
   standing rule for this site and it is why there is no library here. */
(function () {
  'use strict';

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------------------------------------------------- word splitting -- */
  /* The SplitText equivalent, about fifteen lines. Splits on spaces only, so
     it never breaks a word across lines and never touches nested markup it
     does not own. Elements that already contain tags are left alone. */
  document.querySelectorAll('.split').forEach(function (el) {
    if (el.children.length) { return; }          /* has markup, do not touch */
    var words = el.textContent.trim().split(/\s+/);
    if (words.length > 40) { return; }           /* not a headline, skip */
    el.textContent = '';
    words.forEach(function (word, i) {
      var w = document.createElement('span');
      w.className = 'w';
      var inner = document.createElement('i');
      inner.style.setProperty('--i', i);
      inner.textContent = word;
      w.appendChild(inner);
      el.appendChild(w);
      if (i < words.length - 1) { el.appendChild(document.createTextNode(' ')); }
    });
  });

  /* --------------------------------------------- generic "in" observer -- */
  /* Used by .split, .wipe and .ladder. Same failsafe as the original reveal. */
  var animated = document.querySelectorAll('.split, .wipe, .ladder');
  if (animated.length) {
    if (reduced || !hasIO) {
      animated.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
      animated.forEach(function (el) { io.observe(el); });
      window.setTimeout(function () {
        document.querySelectorAll('.split:not(.in), .wipe:not(.in), .ladder:not(.in)')
          .forEach(function (el) { el.classList.add('in'); });
      }, 4000);
    }
  }

  /* ------------------------------------------------ scroll-linked drift -- */
  /* The ScrollTrigger scrub equivalent. Writes --p from 0 to 1 across the
     element's travel through the viewport. rAF-throttled, passive listener,
     and it exits entirely under reduced motion. */
  var drifters = Array.prototype.slice.call(document.querySelectorAll('[data-drift]'));
  if (drifters.length && !reduced) {
    var ticking = false;
    var update = function () {
      var vh = window.innerHeight;
      drifters.forEach(function (el) {
        var box = el.getBoundingClientRect();
        if (box.bottom < -200 || box.top > vh + 200) { return; }
        var p = 1 - (box.top + box.height) / (vh + box.height);
        el.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(4));
      });
      ticking = false;
    };
    var onScroll = function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* The pointer parallax that used to nudge the bubble map is gone with it,
     2026-08-18. The hero device is now a list, and a list that slides around
     under the cursor is harder to read, which was the whole complaint. */

  /* The chapter rail was removed from the markup on 2026-08-18 as one of the
     devices lifted too literally off the reference site, so the code that used
     to light up the current pill went with it. */

  /* --------------------------------------------------------- marquee ----- */
  /* The track has to hold two identical runs for the -50% loop to be
     seamless. The duplicate is built here and hidden from screen readers,
     so the sentence is only ever announced once. */
  document.querySelectorAll('.marq-track').forEach(function (track) {
    var run = track.firstElementChild;
    if (!run) { return; }
    var copy = run.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.appendChild(copy);
  });

})();
