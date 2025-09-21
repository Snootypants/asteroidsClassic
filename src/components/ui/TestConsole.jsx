function TestConsole({
  open,
  effectActions,
  statOptions,
  statSelections,
  onToggleStat,
}) {
  const consoleClasses = ['testConsole'];
  if (open) {
    consoleClasses.push('open');
  }

  return (
    <aside className={consoleClasses.join(' ')} aria-hidden={!open}>
      <header className="testConsole__header">
        <div>
          <h2 className="testConsole__title">Test Console</h2>
          <p className="testConsole__helper">Shift + Tab to toggle</p>
        </div>
        <nav className="testConsole__tabs" aria-label="Test console sections">
          <button type="button" className="testConsole__tab is-active">Effects</button>
          <button type="button" className="testConsole__tab" disabled>Upgrades (soon)</button>
        </nav>
      </header>

      <section className="testConsole__section">
        <div className="testConsole__sectionHeader">
          <h3>Effects</h3>
          <p>Trigger the current visual FX without waiting for gameplay.</p>
        </div>
        <div className="testConsole__effects">
          {effectActions?.length ? (
            effectActions.map(({ key, label, description, hotkey, handler }) => (
              <button
                type="button"
                key={key}
                className="testConsole__effectButton"
                onClick={handler}
              >
                <span>
                  <strong>{label}</strong>
                  {description ? <small>{description}</small> : null}
                </span>
                {hotkey ? <span className="testConsole__chip">[{hotkey}]</span> : null}
              </button>
            ))
          ) : (
            <p className="dim">No effect triggers are available yet.</p>
          )}
        </div>
      </section>

      <section className="testConsole__section">
        <div className="testConsole__sectionHeader">
          <h3>Telemetry</h3>
          <p>Stack debug readouts in the top-left corner.</p>
        </div>
        <div className="testConsole__checkboxList">
          {statOptions?.map(({ key, label }) => (
            <label key={key} className="testConsole__checkbox">
              <input
                type="checkbox"
                checked={Boolean(statSelections[key])}
                onChange={() => onToggleStat(key)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </section>
    </aside>
  );
}

export default TestConsole;
