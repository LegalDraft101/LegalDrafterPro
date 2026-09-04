import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.scss';

function Home() {
    const navigate = useNavigate();

    return (
        <main className="home">
            {/* Hero */}
            <section className="home__hero">
                <div className="home__hero-badge">⚖️ Professional Legal Drafting</div>
                <h1 className="home__title">
                    Draft Legal Documents<br />
                    <span className="home__title-accent">in Minutes</span>
                </h1>
                <p className="home__subtitle">
                    Create affidavits, rent agreements, and more — with a clean, guided workflow. No legal jargon. No clutter.
                </p>
            </section>

            {/* Service Cards */}
            <section className="home__services">
                <div
                    className="home__card"
                    onClick={() => navigate('/affidavit')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/affidavit')}
                >
                    <span className="home__card-icon">📄</span>
                    <h2 className="home__card-title">Affidavit Drafting</h2>
                    <p className="home__card-desc">
                        Draft legally sound affidavits for court, notary, or official use.
                    </p>
                    <span className="home__card-action">
                        Start Drafting <span aria-hidden>→</span>
                    </span>
                </div>

                <div
                    className="home__card"
                    onClick={() => navigate('/rent-agreement')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate('/rent-agreement')}
                >
                    <span className="home__card-icon">🏠</span>
                    <h2 className="home__card-title">Rent Agreement</h2>
                    <p className="home__card-desc">
                        Create clear, standard rent agreements for landlords and tenants.
                    </p>
                    <span className="home__card-action">
                        Start Drafting <span aria-hidden>→</span>
                    </span>
                </div>
            </section>
        </main>
    );
}

export default Home;
