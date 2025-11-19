import { Link } from "react-router-dom";

export const LandingPage = () => (
  <section className="space-y-6 text-center">
    <p className="text-sm uppercase tracking-[0.4em] text-secondary">Certify</p>
    <h1 className="text-4xl font-bold">Verifikasi Sertifikat Akademik On-Chain</h1>
    <p className="mx-auto max-w-2xl text-slate-300">
      Solusi terintegrasi berbasis blockchain + ZKP untuk penerbitan, penyimpanan, dan verifikasi kredensial akademik dengan privasi tinggi.
    </p>
    <div className="flex flex-wrap justify-center gap-4">
      <Link className="btn-primary max-w-xs" to="/issuer">
        Masuk sebagai Issuer
      </Link>
      <Link className="btn-secondary max-w-xs" to="/holder">
        Masuk sebagai Holder
      </Link>
      <Link className="btn-secondary max-w-xs" to="/verifier">
        Masuk sebagai Verifier
      </Link>
    </div>
  </section>
);
