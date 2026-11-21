import React, { useEffect, useRef, useState } from 'react';

const RUG = '/landing/rug.webp';
const BEFORE = '/landing/room-before.webp';
const AFTER = '/landing/room-after.webp';

export type StoreMode = 'physical' | 'online';

function RugHeader({ label }: { label: string }) {
  return (
    <div className="hd-rug-header">
      <img src={RUG} width={38} height={42} alt="" />
      <div><small>{label}</small><strong>Klasik desenli halı</strong></div>
    </div>
  );
}

function RoomComparison({ compact = false }: { compact?: boolean }) {
  const [split, setSplit] = useState(compact ? 24 : 50);

  return (
    <div className="hd-comparison">
      <img src={AFTER} alt="Halı yerleştirildikten sonra örnek oda" width={852} height={1002} decoding="async" />
      <img
        className="hd-comparison-before"
        src={BEFORE}
        alt=""
        width={852}
        height={1002}
        decoding="async"
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
      />
      <span className="hd-photo-label hd-photo-label-before" aria-hidden="true">Önce</span>
      <span className="hd-photo-label hd-photo-label-after" aria-hidden="true">Sonra</span>
      <div className="hd-comparison-divider" style={{ left: `${split}%` }} aria-hidden="true"><span>↔</span></div>
      <input
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={event => setSplit(event.currentTarget.valueAsNumber)}
        aria-label="Öncesi ve sonrası karşılaştırması"
        aria-valuetext={`Önce yüzde ${split}, sonra yüzde ${100 - split}`}
      />
    </div>
  );
}

function UploadPanel() {
  return (
    <div className="hd-upload-panel">
      <span className="hd-stage-icon" aria-hidden="true">↑</span>
      <strong>Oda fotoğrafını ekleyin</strong>
      <span>Kameradan çekin veya galeriden seçin.</span>
    </div>
  );
}

function RoomPhoto() {
  return (
    <div className="hd-stage-photo">
      <img src={BEFORE} alt="Halı yerleştirilmeden önce örnek oda" width={852} height={1002} loading="lazy" decoding="async" />
      <span className="hd-photo-label hd-photo-label-before">Fotoğraf hazır</span>
    </div>
  );
}

function ProgressPanel() {
  return (
    <div className="hd-progress-panel">
      <span className="hd-stage-icon" aria-hidden="true">✦</span>
      <strong>Önizleme hazırlanıyor</strong>
      <span>Yapay zeka halıyı odanın perspektifine yerleştirir.</span>
      <span className="hd-progress-bar" aria-hidden="true" />
    </div>
  );
}

function DownloadResult() {
  return <a className="hd-button hd-button-primary" href={AFTER} download="hali-dene-ornek-sonuc.webp">Sonucu indir</a>;
}

export function AppPreview({ mode, onDemo }: { mode: StoreMode; onDemo: () => void }) {
  const physical = mode === 'physical';

  return (
    <div className="hd-app-preview">
      <div className="hd-app-window">
        <div className="hd-app-toolbar">
          <span className="hd-app-mark" aria-hidden="true">H</span>
          <div><strong>Halı Dene</strong><small>{physical ? 'Mağaza uygulaması' : 'Online mağaza önizlemesi'}</small></div>
        </div>
        <div className="hd-app-workspace">
          <div className="hd-app-product">
            <img src={RUG} width={500} height={719} alt="Örnekte kullanılan klasik desenli halı" decoding="async" />
          </div>
          <div className="hd-app-product-info">
            <span className="hd-app-label">Seçili halı</span>
            <strong>Klasik desenli halı</strong>
            <p>{physical ? 'Mağazada seçtiğiniz halıyı müşterinizin odasında gösterin.' : 'Müşteriniz seçtiği halıyı ürün sayfasından kendi odasında görsün.'}</p>
            <button className="hd-button hd-button-primary" type="button" onClick={onDemo}>
              {physical ? 'Odada göster' : 'Odamda gör'}
            </button>
          </div>
        </div>
      </div>
      <div className="hd-result-window">
        <RugHeader label="Oda önizlemesi" />
        <RoomComparison compact />
        <div className="hd-result-actions"><DownloadResult /></div>
      </div>
    </div>
  );
}

const STEPS = [
  { title: 'Oda fotoğrafı yükleyin', description: 'Müşterinizin odasını telefon kamerasıyla çekin.', Preview: UploadPanel, demo: true },
  { title: 'Fotoğrafı onaylayın', description: 'Odanın ve seçtiğiniz halının önizlemesini kontrol edin.', Preview: RoomPhoto },
  { title: 'Önizlemeyi hazırlayın', description: 'Yapay zeka halıyı odanın ışığına ve perspektifine uyarlar.', Preview: ProgressPanel },
  { title: 'Önce ve sonrayı görün', description: 'Sonucu müşterinizle paylaşın veya cihazınıza indirin.', Preview: RoomComparison, download: true },
];

export function FlowShowcase({ onDemo }: { onDemo: () => void }) {
  return (
    <section className="hd-flow" id="nasil-calisir" aria-labelledby="hd-flow-title">
      <div className="hd-container">
        <div className="hd-section-heading">
          <h2 id="hd-flow-title">Nasıl Çalışır?</h2>
          <p>Oda fotoğrafından yapay zeka ile halı deneme sonucuna, dört adımda.</p>
        </div>
        <ol className="hd-step-grid">
          {STEPS.map(({ title, description, Preview, demo, download }, index) => (
            <li key={title}>
              <h3><span aria-hidden="true">{index + 1}</span>{title}</h3>
              <div className="hd-step-card">
                <RugHeader label="Halı Dene" />
                <Preview />
                <p>{description}</p>
                {demo && <button className="hd-button hd-button-secondary" type="button" onClick={onDemo}>Demoyu aç</button>}
                {download && <DownloadResult />}
              </div>
            </li>
          ))}
        </ol>
        <div className="hd-section-action">
          <button className="hd-button hd-button-primary" type="button" onClick={onDemo}>Örnek odayla deneyin</button>
        </div>
      </div>
    </section>
  );
}

type DemoStage = 'upload' | 'confirm' | 'processing' | 'result';

export function ExampleDemo({ dialogRef }: { dialogRef: React.RefObject<HTMLDialogElement | null> }) {
  const [stage, setStage] = useState<DemoStage>('upload');
  const statusRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (stage !== 'processing') return;
    const timer = window.setTimeout(() => setStage('result'), 850);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'upload') statusRef.current?.focus();
  }, [stage]);

  const titles: Record<DemoStage, string> = {
    upload: 'Oda fotoğrafını seçin',
    confirm: 'Fotoğrafı onaylayın',
    processing: 'Örnek sonuç hazırlanıyor',
    result: 'Önce ve sonrayı karşılaştırın',
  };

  return (
    <dialog className="hd-demo" ref={dialogRef} aria-labelledby="hd-demo-title" onClose={() => setStage('upload')}>
      <div className="hd-demo-top">
        <div><small>Örnek oda demosu</small><h2 ref={statusRef} id="hd-demo-title" tabIndex={-1}>{titles[stage]}</h2></div>
        <button className="hd-icon-button" type="button" aria-label="Demoyu kapat" onClick={() => dialogRef.current?.close()}>×</button>
      </div>
      {stage === 'upload' && (
        <>
          <RoomPhoto />
          <p>Hazır bir oda fotoğrafıyla Halı Dene’yi hesabınız olmadan keşfedin.</p>
          <button className="hd-button hd-button-primary" type="button" onClick={() => setStage('confirm')}>Örnek fotoğrafı seç</button>
        </>
      )}
      {stage === 'confirm' && (
        <>
          <RoomPhoto />
          <div className="hd-demo-actions">
            <button className="hd-button hd-button-secondary" type="button" onClick={() => setStage('upload')}>Geri</button>
            <button className="hd-button hd-button-primary" type="button" onClick={() => setStage('processing')}>Örnek sonucu göster</button>
          </div>
        </>
      )}
      {stage === 'processing' && <ProgressPanel />}
      {stage === 'result' && (
        <>
          <RoomComparison />
          <div className="hd-demo-actions">
            <button className="hd-button hd-button-secondary" type="button" onClick={() => setStage('upload')}>Tekrar dene</button>
            <DownloadResult />
          </div>
        </>
      )}
    </dialog>
  );
}
