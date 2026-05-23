import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "running-shoe-mileage-pwa-v1";

function makeId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function km(value) {
  return `${Math.round(value * 10) / 10} km`;
}

function getStatus(totalKm, lifeKm, retired) {
  if (retired) return { text: "은퇴", className: "badge muted" };
  const ratio = lifeKm > 0 ? totalKm / lifeKm : 0;
  if (ratio >= 1) return { text: "교체 권장", className: "badge danger" };
  if (ratio >= 0.85) return { text: "교체 준비", className: "badge warning" };
  return { text: "사용 가능", className: "badge good" };
}

const starterShoe = {
  id: makeId(),
  name: "데일리 러닝화",
  brand: "",
  purchaseDate: today(),
  lifeKm: 700,
  initialKm: 0,
  retired: false
};

export default function App() {
  const [shoes, setShoes] = useState([starterShoe]);
  const [runs, setRuns] = useState([]);
  const [selectedTab, setSelectedTab] = useState("record");
  const [filterShoeId, setFilterShoeId] = useState("all");
  const restoreInputRef = useRef(null);

  const [shoeForm, setShoeForm] = useState({
    name: "",
    brand: "",
    purchaseDate: today(),
    lifeKm: 700,
    initialKm: 0
  });

  const [runForm, setRunForm] = useState({
    shoeId: starterShoe.id,
    date: today(),
    distanceKm: "",
    memo: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.shoes) && Array.isArray(parsed.runs)) {
        setShoes(parsed.shoes);
        setRuns(parsed.runs);
        const firstActive = parsed.shoes.find((shoe) => !shoe.retired) || parsed.shoes[0];
        if (firstActive) {
          setRunForm((prev) => ({ ...prev, shoeId: firstActive.id }));
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ shoes, runs }));
  }, [shoes, runs]);

  const shoeStats = useMemo(() => {
    return shoes.map((shoe) => {
      const addedKm = runs
        .filter((run) => run.shoeId === shoe.id)
        .reduce((sum, run) => sum + toNumber(run.distanceKm), 0);

      const totalKm = toNumber(shoe.initialKm) + addedKm;
      const lifeKm = Math.max(1, toNumber(shoe.lifeKm, 700));
      const percent = Math.min(100, Math.round((totalKm / lifeKm) * 100));
      const remainingKm = Math.max(0, lifeKm - totalKm);
      const runCount = runs.filter((run) => run.shoeId === shoe.id).length;

      return { ...shoe, addedKm, totalKm, lifeKm, percent, remainingKm, runCount };
    });
  }, [shoes, runs]);

  const activeShoes = shoeStats.filter((shoe) => !shoe.retired);
  const totalKm = runs.reduce((sum, run) => sum + toNumber(run.distanceKm), 0);

  const filteredRuns = useMemo(() => {
    return [...runs]
      .filter((run) => filterShoeId === "all" || run.shoeId === filterShoeId)
      .sort((a, b) => `${b.date}`.localeCompare(`${a.date}`));
  }, [runs, filterShoeId]);

  function addRun(event) {
    event.preventDefault();

    const distanceKm = toNumber(runForm.distanceKm);
    if (!runForm.shoeId || distanceKm <= 0) {
      alert("러닝화와 거리를 입력해주세요.");
      return;
    }

    setRuns((prev) => [
      ...prev,
      {
        id: makeId(),
        shoeId: runForm.shoeId,
        date: runForm.date || today(),
        distanceKm,
        memo: runForm.memo.trim()
      }
    ]);

    setRunForm((prev) => ({
      ...prev,
      date: today(),
      distanceKm: "",
      memo: ""
    }));
  }

  function addShoe(event) {
    event.preventDefault();

    if (!shoeForm.name.trim()) {
      alert("러닝화 이름을 입력해주세요.");
      return;
    }

    const newShoe = {
      id: makeId(),
      name: shoeForm.name.trim(),
      brand: shoeForm.brand.trim(),
      purchaseDate: shoeForm.purchaseDate || today(),
      lifeKm: Math.max(1, toNumber(shoeForm.lifeKm, 700)),
      initialKm: Math.max(0, toNumber(shoeForm.initialKm)),
      retired: false
    };

    setShoes((prev) => [...prev, newShoe]);
    setRunForm((prev) => ({ ...prev, shoeId: newShoe.id }));
    setShoeForm({
      name: "",
      brand: "",
      purchaseDate: today(),
      lifeKm: 700,
      initialKm: 0
    });
    setSelectedTab("record");
  }

  function deleteRun(id) {
    if (!window.confirm("이 러닝 기록을 삭제할까요?")) return;
    setRuns((prev) => prev.filter((run) => run.id !== id));
  }

  function deleteShoe(id) {
    if (!window.confirm("러닝화를 삭제하면 해당 러닝 기록도 함께 삭제됩니다. 계속할까요?")) return;
    setShoes((prev) => prev.filter((shoe) => shoe.id !== id));
    setRuns((prev) => prev.filter((run) => run.shoeId !== id));
  }

  function toggleRetired(id) {
    setShoes((prev) => prev.map((shoe) => (
      shoe.id === id ? { ...shoe, retired: !shoe.retired } : shoe
    )));
  }

  function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const rows = [
      ["date", "shoe", "brand", "distance_km", "memo"],
      ...runs
        .sort((a, b) => `${a.date}`.localeCompare(`${b.date}`))
        .map((run) => {
          const shoe = shoes.find((item) => item.id === run.shoeId);
          return [run.date, shoe?.name || "삭제된 러닝화", shoe?.brand || "", run.distanceKm, run.memo || ""];
        })
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    downloadFile(`running-shoe-records-${today()}.csv`, "\ufeff" + csv, "text/csv;charset=utf-8");
  }

  function exportBackup() {
    const payload = {
      app: "running-shoe-mileage-pwa",
      exportedAt: new Date().toISOString(),
      shoes,
      runs
    };

    downloadFile(
      `running-shoe-backup-${today()}.json`,
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8"
    );
  }

  function restoreBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed.shoes) || !Array.isArray(parsed.runs)) {
          alert("백업 파일 형식이 올바르지 않습니다.");
          return;
        }

        if (!window.confirm("현재 데이터를 백업 파일 내용으로 바꿀까요?")) return;

        setShoes(parsed.shoes);
        setRuns(parsed.runs);
        const firstActive = parsed.shoes.find((shoe) => !shoe.retired) || parsed.shoes[0];
        if (firstActive) {
          setRunForm((prev) => ({ ...prev, shoeId: firstActive.id }));
        }
      } catch {
        alert("백업 파일을 읽지 못했습니다.");
      } finally {
        event.target.value = "";
      }
    };

    reader.readAsText(file);
  }

  function resetAll() {
    if (!window.confirm("모든 러닝화와 기록을 초기화할까요?")) return;
    const fresh = { ...starterShoe, id: makeId(), purchaseDate: today() };
    setShoes([fresh]);
    setRuns([]);
    setRunForm({ shoeId: fresh.id, date: today(), distanceKm: "", memo: "" });
  }

  const fastestAddDistance = ["3.0", "3.5", "4.0", "5.0"];

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">개인용 PWA</p>
          <h1>러닝화 마일리지</h1>
          <p className="sub">러닝 후 신발을 선택하고 거리만 입력하면 누적 수명을 자동으로 관리합니다.</p>
        </div>

        <div className="summary-grid">
          <div className="summary-card">
            <span>총 러닝</span>
            <strong>{km(totalKm)}</strong>
          </div>
          <div className="summary-card">
            <span>등록 신발</span>
            <strong>{shoes.length}개</strong>
          </div>
        </div>
      </section>

      <nav className="tabs" aria-label="화면 전환">
        <button className={selectedTab === "record" ? "active" : ""} onClick={() => setSelectedTab("record")}>기록</button>
        <button className={selectedTab === "shoes" ? "active" : ""} onClick={() => setSelectedTab("shoes")}>러닝화</button>
        <button className={selectedTab === "history" ? "active" : ""} onClick={() => setSelectedTab("history")}>내역</button>
        <button className={selectedTab === "backup" ? "active" : ""} onClick={() => setSelectedTab("backup")}>백업</button>
      </nav>

      {selectedTab === "record" && (
        <section className="panel">
          <div className="section-title">
            <h2>러닝 기록 입력</h2>
            <p>운동 직후 스마트폰에서 빠르게 입력하세요.</p>
          </div>

          <form onSubmit={addRun} className="form">
            <label>
              러닝화
              <select value={runForm.shoeId} onChange={(event) => setRunForm((prev) => ({ ...prev, shoeId: event.target.value }))}>
                {activeShoes.length === 0 && <option value="">사용 중인 러닝화 없음</option>}
                {activeShoes.map((shoe) => (
                  <option key={shoe.id} value={shoe.id}>{shoe.name}</option>
                ))}
              </select>
            </label>

            <label>
              날짜
              <input type="date" value={runForm.date} onChange={(event) => setRunForm((prev) => ({ ...prev, date: event.target.value }))} />
            </label>

            <label>
              거리 km
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="예: 3.45"
                value={runForm.distanceKm}
                onChange={(event) => setRunForm((prev) => ({ ...prev, distanceKm: event.target.value }))}
              />
            </label>

            <div className="quick-buttons">
              {fastestAddDistance.map((distance) => (
                <button key={distance} type="button" onClick={() => setRunForm((prev) => ({ ...prev, distanceKm: distance }))}>
                  {distance} km
                </button>
              ))}
            </div>

            <label>
              메모
              <input
                type="text"
                placeholder="예: 인터벌, 조깅, 비 온 뒤 노면"
                value={runForm.memo}
                onChange={(event) => setRunForm((prev) => ({ ...prev, memo: event.target.value }))}
              />
            </label>

            <button className="primary-button" type="submit">기록 추가</button>
          </form>
        </section>
      )}

      {selectedTab === "shoes" && (
        <section className="stack">
          <div className="panel">
            <div className="section-title">
              <h2>러닝화 등록</h2>
              <p>권장 수명은 보통 600~800km로 시작하고, 쿠션감이나 통증에 따라 조정하면 좋습니다.</p>
            </div>

            <form onSubmit={addShoe} className="form">
              <label>
                모델명
                <input
                  type="text"
                  placeholder="예: 젤 카야노 31"
                  value={shoeForm.name}
                  onChange={(event) => setShoeForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </label>

              <label>
                브랜드 / 별명
                <input
                  type="text"
                  placeholder="예: 아식스, 출근 전 조깅용"
                  value={shoeForm.brand}
                  onChange={(event) => setShoeForm((prev) => ({ ...prev, brand: event.target.value }))}
                />
              </label>

              <div className="two-col">
                <label>
                  구매일
                  <input
                    type="date"
                    value={shoeForm.purchaseDate}
                    onChange={(event) => setShoeForm((prev) => ({ ...prev, purchaseDate: event.target.value }))}
                  />
                </label>

                <label>
                  권장 수명 km
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={shoeForm.lifeKm}
                    onChange={(event) => setShoeForm((prev) => ({ ...prev, lifeKm: event.target.value }))}
                  />
                </label>
              </div>

              <label>
                기존 누적거리 km
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  value={shoeForm.initialKm}
                  onChange={(event) => setShoeForm((prev) => ({ ...prev, initialKm: event.target.value }))}
                />
              </label>

              <button className="primary-button" type="submit">러닝화 추가</button>
            </form>
          </div>

          <div className="shoe-list">
            {shoeStats
              .sort((a, b) => Number(a.retired) - Number(b.retired) || b.totalKm - a.totalKm)
              .map((shoe) => {
                const status = getStatus(shoe.totalKm, shoe.lifeKm, shoe.retired);

                return (
                  <article key={shoe.id} className={`shoe-card ${shoe.retired ? "retired" : ""}`}>
                    <div className="shoe-card-head">
                      <div>
                        <h3>{shoe.name}</h3>
                        <p>{shoe.brand ? `${shoe.brand} · ` : ""}구매일 {shoe.purchaseDate || "미입력"}</p>
                      </div>
                      <span className={status.className}>{status.text}</span>
                    </div>

                    <div className="progress-line">
                      <div>
                        <span>누적 {km(shoe.totalKm)}</span>
                        <strong>{shoe.percent}%</strong>
                      </div>
                      <div className="progress-track">
                        <div className="progress-bar" style={{ width: `${shoe.percent}%` }} />
                      </div>
                    </div>

                    <div className="mini-stats">
                      <div><span>권장</span><strong>{km(shoe.lifeKm)}</strong></div>
                      <div><span>남음</span><strong>{km(shoe.remainingKm)}</strong></div>
                      <div><span>횟수</span><strong>{shoe.runCount}회</strong></div>
                    </div>

                    <div className="button-row">
                      <button type="button" onClick={() => toggleRetired(shoe.id)}>{shoe.retired ? "사용 재개" : "은퇴 처리"}</button>
                      <button type="button" className="danger-text" onClick={() => deleteShoe(shoe.id)}>삭제</button>
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      )}

      {selectedTab === "history" && (
        <section className="panel">
          <div className="section-title">
            <h2>러닝 내역</h2>
            <p>잘못 입력한 기록은 삭제할 수 있습니다.</p>
          </div>

          <label className="filter">
            러닝화 필터
            <select value={filterShoeId} onChange={(event) => setFilterShoeId(event.target.value)}>
              <option value="all">전체 러닝화</option>
              {shoes.map((shoe) => (
                <option key={shoe.id} value={shoe.id}>{shoe.name}</option>
              ))}
            </select>
          </label>

          <div className="history-list">
            {filteredRuns.length === 0 ? (
              <p className="empty">아직 러닝 기록이 없습니다.</p>
            ) : (
              filteredRuns.map((run) => {
                const shoe = shoes.find((item) => item.id === run.shoeId);
                return (
                  <article key={run.id} className="history-item">
                    <div>
                      <strong>{km(run.distanceKm)} · {run.date}</strong>
                      <p>{shoe?.name || "삭제된 러닝화"}{run.memo ? ` · ${run.memo}` : ""}</p>
                    </div>
                    <button type="button" onClick={() => deleteRun(run.id)}>삭제</button>
                  </article>
                );
              })
            )}
          </div>
        </section>
      )}

      {selectedTab === "backup" && (
        <section className="panel">
          <div className="section-title">
            <h2>백업 / 복원</h2>
            <p>이 앱의 기본 데이터는 현재 기기의 브라우저에 저장됩니다. 가끔 백업 파일을 저장해두세요.</p>
          </div>

          <div className="backup-grid">
            <button className="primary-button" type="button" onClick={exportBackup}>전체 백업 저장</button>
            <button type="button" onClick={() => restoreInputRef.current?.click()}>백업 파일 복원</button>
            <button type="button" onClick={exportCsv}>CSV 내보내기</button>
            <button type="button" className="danger-text" onClick={resetAll}>전체 초기화</button>
          </div>

          <input
            ref={restoreInputRef}
            className="hidden-input"
            type="file"
            accept="application/json,.json"
            onChange={restoreBackup}
          />

          <div className="note">
            <strong>스마트폰 설치 방법</strong>
            <ol>
              <li>배포된 주소를 스마트폰 Chrome 또는 Safari에서 엽니다.</li>
              <li>Android Chrome: 메뉴 ⋮ → 홈 화면에 추가</li>
              <li>iPhone Safari: 공유 버튼 → 홈 화면에 추가</li>
            </ol>
          </div>
        </section>
      )}
    </main>
  );
}
