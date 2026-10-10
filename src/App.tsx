import { ArrowUpRight, Globe2, RotateCcw, ScanLine } from 'lucide-react'
import { WorldMap } from './components/WorldMap'
import { DestinationPanel } from './components/DestinationPanel'
import { frontendAdapter, useExplorer } from './store/explorerStore'
import { ACCESS_LABELS } from './frontend/types'

export default function App() {
  const { passportId, destinationId, selectPassport, selectDestination, reset } = useExplorer()
  const passports = frontendAdapter.getPassports()
  const destinations = frontendAdapter.getDestinations()
  const passport = passports.find(country => country.id === passportId)!
  const destination = destinations.find(country => country.id === destinationId) ?? null
  const access = frontendAdapter.getAccess(passportId)
  const requirements = destinationId ? frontendAdapter.getRequirements(passportId, destinationId) : null
  return <>
    <a className="skip-link" href="#explorer">Skip to explorer</a>
    <header className="app-header">
      <a className="brand" href="#explorer" aria-label="aperiron explorer"><Globe2 size={25} /><span>aperiron<span className="brand-dot">.</span></span></a>
      <nav aria-label="Main navigation"><a className="nav-active" href="#explorer">Explore</a><span className="nav-upcoming">Visa DNA <small>Coming next</small></span><span className="nav-upcoming">Border Market <small>Coming next</small></span></nav>
      <span className="environment-badge"><span />Frontend preview</span>
    </header>
    <main id="explorer">
      <section className="page-heading"><div><p className="eyebrow">THE PASSPORT PARADOX / 01</p><h1>One world.<br /><span>Different possibilities.</span></h1><p className="intro">Explore the world through a different passport.</p></div>
        <div className="passport-control"><label htmlFor="passport">YOUR PASSPORT</label><div className="select-wrap"><ScanLine size={21} /><select id="passport" value={passportId} onChange={event => selectPassport(event.target.value)}>{passports.map(country => <option key={country.id} value={country.id}>{country.name}</option>)}</select><ArrowUpRight size={19} /></div><p>Change your passport. Keep your destination.</p></div>
      </section>
      <section className="workspace" aria-label="Passport mobility explorer">
        <div className="map-panel"><div className="panel-toolbar"><div><span className="eyebrow">GLOBAL ACCESS</span><h2>{passport.name}<span> passport</span></h2></div><button className="icon-button" onClick={reset} aria-label="Reset exploration"><RotateCcw size={17} /></button></div>
          <WorldMap destinations={destinations} access={access} selectedDestinationId={destinationId} onSelectDestination={selectDestination} />
          <div className="access-legend" aria-label="Entry requirement legend">{Object.entries(ACCESS_LABELS).map(([key, label]) => <span key={key}><i className={`access-dot access-${key}`} />{label}</span>)}</div>
        </div>
        <DestinationPanel passport={passport} destination={destination} requirements={requirements} onClose={() => selectDestination(null)} />
      </section>
      <footer className="dataset-note"><span className="sample-tag">SAMPLE DATA</span><p>{frontendAdapter.datasetLabel}. Classifications are fictional UI fixtures, not travel guidance.</p></footer>
    </main>
    <footer className="app-footer"><span>aperiron / The Passport Paradox</span><span>Explore. Compare. Reimagine.</span></footer>
  </>
}
