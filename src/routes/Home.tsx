export function Home() {
  return (
    <section className="page hero-panel">
      <p className="eyebrow">Mobile-first website</p>
      <h1>Bienvenidos a boda-jyc</h1>
      <p className="lead">
        Base inicial con React + TypeScript + Vite y arquitectura lista para crecer.
      </p>
      <div className="actions">
        <button type="button" className="primary">
          Confirmar asistencia
        </button>
        <button type="button">Ver cronograma</button>
      </div>
    </section>
  );
}
