import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

function Statistiques() {

  const [ongletActif, setOngletActif] = useState("stock");

  const ONGLETS = [
    { id: "stock",        label: "Stock" },
    { id: "consommation", label: "Consommation" },
    { id: "ventes",       label: "Ventes" },
    { id: "evolution",    label: "Évolution des ventes" },
    { id: "couts",        label: "Coûts & Marges" },
  ];

  const [donnees, setDonnees] = useState([]);
  const [produitSelectionne, setProduitSelectionne] = useState("");
  const [erreur, setErreur] = useState("");

  const [dernieresConsommations, setDernieresConsommations] = useState([]);
  const [totalVentesRecettes, setTotalVentesRecettes] = useState([]);
  const [ventesParJour, setVentesParJour] = useState([]);
  const [ventesParSemaine, setVentesParSemaine] = useState([]);
  const [recetteSelectionnee, setRecetteSelectionnee] = useState("");
  const [modeVente, setModeVente] = useState("jour");
  const [stockTheorique, setStockTheorique] = useState([]);

  // Coûts & Marges
  const [coutsMatieres, setCoutsMatieres] = useState([]);
  const [recetteDetailCout, setRecetteDetailCout] = useState("");
  const [detailCout, setDetailCout] = useState([]);
  const [chargementDetail, setChargementDetail] = useState(false);

  const [chargement, setChargement] = useState(true);

  async function fetchAvecToken(url) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Utilisateur non connecté");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${data.session.access_token}` }
    });
    if (!response.ok) throw new Error("Erreur lors du chargement des statistiques");
    return response.json();
  }

  useEffect(() => {
    async function chargerStats() {
      try {
        const [consommation, derniereConso, totalVentes, ventesJour, ventesSemaine, stock, couts] =
          await Promise.all([
            fetchAvecToken(`${import.meta.env.VITE_API_URL}/stats/consommation`),
            fetchAvecToken(`${import.meta.env.VITE_API_URL}/stats/derniere-consommation`),
            fetchAvecToken(`${import.meta.env.VITE_API_URL}/stats/ventes/total-recettes`),
            fetchAvecToken(`${import.meta.env.VITE_API_URL}/stats/ventes/par-jour`),
            fetchAvecToken(`${import.meta.env.VITE_API_URL}/stats/ventes/par-semaine`),
            fetchAvecToken(`${import.meta.env.VITE_API_URL}/stats/stock-theorique`),
            fetchAvecToken(`${import.meta.env.VITE_API_URL}/stats/couts-matieres`)
          ]);

        setDonnees(consommation);
        if (consommation.length > 0) setProduitSelectionne(consommation[0].produit_nom);

        setDernieresConsommations(derniereConso);
        setTotalVentesRecettes(totalVentes);

        setVentesParJour(ventesJour);
        if (ventesJour.length > 0) setRecetteSelectionnee(ventesJour[0].recette_nom);

        setVentesParSemaine(ventesSemaine);
        setStockTheorique(stock);
        setCoutsMatieres(couts);
        if (couts.length > 0) setRecetteDetailCout(String(couts[0].recette_id));

      } catch (error) {
        setErreur(error.message);
      } finally {
        setChargement(false);
      }
    }

    chargerStats();
  }, []);

  // Charger le détail ingrédients quand on change de recette sélectionnée
  useEffect(() => {
    if (!recetteDetailCout) return;
    async function chargerDetail() {
      setChargementDetail(true);
      try {
        const data = await fetchAvecToken(
          `${import.meta.env.VITE_API_URL}/stats/couts-matieres/${recetteDetailCout}`
        );
        setDetailCout(data);
      } catch {
        setDetailCout([]);
      } finally {
        setChargementDetail(false);
      }
    }
    chargerDetail();
  }, [recetteDetailCout]);

  const produits = [...new Set(donnees.map((item) => item.produit_nom))];

  const donneesProduit = donnees
    .filter((item) => item.produit_nom === produitSelectionne)
    .map((item) => ({
      date: new Date(item.date_stock_actuel).toLocaleDateString("fr-FR"),
      consommation: Number(item.consommation_estimee),
      unite: item.unite
    }));

  const recettes = [
    ...new Set([
      ...ventesParJour.map((item) => item.recette_nom),
      ...ventesParSemaine.map((item) => item.recette_nom)
    ])
  ];

  const donneesVentes = modeVente === "jour" ? ventesParJour : ventesParSemaine;

  const donneesVentesRecette = donneesVentes
    .filter((item) => item.recette_nom === recetteSelectionnee)
    .map((item) => ({
      date: modeVente === "jour"
        ? new Date(item.jour).toLocaleDateString("fr-FR")
        : new Date(item.semaine).toLocaleDateString("fr-FR"),
      quantite_vendue: Number(item.quantite_vendue)
    }));

  // Couleur barre marge
  function couleurMarge(taux) {
    if (taux == null) return "#ccc";
    if (taux >= 30) return "#38a169";
    if (taux >= 15) return "#b7791f";
    return "#e53e3e";
  }

  if (chargement) return <p>Chargement des statistiques...</p>;

  return (
    <div>
      <h2 style={{ textAlign: "left", marginBottom: "2rem" }}>Statistiques</h2>

      {erreur && <p style={{ color: "red" }}>{erreur}</p>}

      {/* Onglets */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        backgroundColor: "white", borderBottom: "1px solid #eee",
        display: "flex", gap: "0.5rem", padding: "0.75rem 0", marginBottom: "2rem",
        flexWrap: "wrap"
      }}>
        {ONGLETS.map(onglet => (
          <button
            key={onglet.id}
            onClick={() => {
              setOngletActif(onglet.id);
              document.getElementById(onglet.id)?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              padding: "0.5rem 1.25rem", borderRadius: "20px", border: "1px solid #ccc",
              backgroundColor: ongletActif === onglet.id ? "#333" : "white",
              color: ongletActif === onglet.id ? "white" : "#333",
              cursor: "pointer",
              fontWeight: ongletActif === onglet.id ? "bold" : "normal",
              fontSize: "0.9rem"
            }}
          >
            {onglet.label}
          </button>
        ))}
      </div>

      {/* ── Stock théorique ── */}
      <div id="stock" style={{ width: "100%", backgroundColor: "white", padding: "2rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", marginBottom: "3rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Stock théorique par produit</h3>
        {stockTheorique.length === 0 ? (
          <p>Aucune donnée de stock disponible.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Produit</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Catégorie</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Dernier inventaire</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Reçu depuis</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Consommé depuis</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Stock théorique</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Seuil alerte</th>
                <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Unité</th>
              </tr>
            </thead>
            <tbody>
              {stockTheorique.map((produit) => {
                const critique = produit.seuil_alerte > 0 && produit.stock_theorique <= produit.seuil_alerte;
                return (
                  <tr key={produit.produit_id} style={{ backgroundColor: critique ? "#fff5f5" : "transparent" }}>
                    <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem", fontWeight: critique ? "bold" : "normal" }}>
                      {critique && "⚠️ "}{produit.produit_nom}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>{produit.categorie}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>{produit.stock_dernier_inventaire}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>+{produit.total_recu_depuis_inventaire}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>-{produit.total_consomme_depuis_inventaire}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem", color: critique ? "#e53e3e" : "#38a169", fontWeight: "bold" }}>
                      {produit.stock_theorique}
                    </td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>{produit.seuil_alerte}</td>
                    <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>{produit.unite}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Consommation ── */}
      <div id="consommation" style={{ marginBottom: "2rem", maxWidth: "400px" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>Produit</label>
        <select value={produitSelectionne} onChange={(e) => setProduitSelectionne(e.target.value)}
          style={{ width: "100%", padding: "0.75rem", borderRadius: "5px", border: "1px solid #ccc", fontSize: "1rem" }}>
          {produits.map((produit) => (
            <option key={produit} value={produit}>{produit}</option>
          ))}
        </select>
      </div>

      <div style={{ width: "100%", height: "400px", backgroundColor: "white", padding: "2rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
        <h3 style={{ marginBottom: "1rem" }}>Évolution de la consommation estimée</h3>
        {donneesProduit.length === 0 ? <p>Aucune donnée disponible pour ce produit.</p> : (
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={donneesProduit}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="consommation" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={{ width: "100%", height: "500px", backgroundColor: "white", padding: "2rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", marginTop: "3rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Dernière consommation estimée par produit</h3>
        {dernieresConsommations.length === 0 ? <p>Aucune consommation disponible.</p> : (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={dernieresConsommations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="produit_nom" angle={-20} textAnchor="end" interval={0} height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="consommation_estimee" fill="#333" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Ventes ── */}
      <div id="ventes" style={{ width: "100%", height: "500px", backgroundColor: "white", padding: "2rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", marginTop: "3rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Total vendu par recette</h3>
        {totalVentesRecettes.length === 0 ? <p>Aucune vente enregistrée.</p> : (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={totalVentesRecettes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="recette_nom" angle={-20} textAnchor="end" interval={0} height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_vendu" fill="#333" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Évolution des ventes ── */}
      <div id="evolution" style={{ width: "100%", height: "450px", backgroundColor: "white", padding: "2rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", marginTop: "3rem", marginBottom: "3rem" }}>
        <h3 style={{ marginBottom: "1rem" }}>Évolution des ventes par recette</h3>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", maxWidth: "600px" }}>
          <select value={recetteSelectionnee} onChange={(e) => setRecetteSelectionnee(e.target.value)}
            style={{ flex: 1, padding: "0.75rem", borderRadius: "5px", border: "1px solid #ccc" }}>
            {recettes.map((recette) => (
              <option key={recette} value={recette}>{recette}</option>
            ))}
          </select>
          <select value={modeVente} onChange={(e) => setModeVente(e.target.value)}
            style={{ width: "160px", padding: "0.75rem", borderRadius: "5px", border: "1px solid #ccc" }}>
            <option value="jour">Par jour</option>
            <option value="semaine">Par semaine</option>
          </select>
        </div>
        {donneesVentesRecette.length === 0 ? <p>Aucune donnée de vente disponible pour cette recette.</p> : (
          <ResponsiveContainer width="100%" height="75%">
            <LineChart data={donneesVentesRecette}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="quantite_vendue" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Coûts & Marges ── */}
      <div id="couts" style={{ marginBottom: "3rem" }}>
        <h3 style={{ marginBottom: "0.5rem" }}>Coûts & Marges</h3>
        <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: "2rem" }}>
          Coût matière, marge brute et taux de marge par recette.
        </p>

        {coutsMatieres.length === 0 ? (
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", color: "#888", textAlign: "center" }}>
            Aucune donnée — renseignez les prix des produits et le prix de vente des recettes.
          </div>
        ) : (
          <>
            {/* Tableau récap */}
            <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", marginBottom: "2rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Recette</th>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Prix vente</th>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Coût matière</th>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Marge</th>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Taux de marge</th>
                    <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Données</th>
                  </tr>
                </thead>
                <tbody>
                  {coutsMatieres.map((r) => (
                    <tr key={r.recette_id}>
                      <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem", fontWeight: "bold" }}>{r.recette_nom}</td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                        {r.prix_vente != null ? `${r.prix_vente} €` : <span style={{ color: "#aaa" }}>—</span>}
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>{r.cout_matiere} €</td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                        {r.marge != null
                          ? <span style={{ color: r.marge >= 0 ? "#38a169" : "#e53e3e", fontWeight: "bold" }}>{r.marge} €</span>
                          : <span style={{ color: "#aaa" }}>—</span>
                        }
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                        {r.taux_marge != null
                          ? <span style={{ color: couleurMarge(r.taux_marge), fontWeight: "bold" }}>{r.taux_marge} %</span>
                          : <span style={{ color: "#aaa" }}>—</span>
                        }
                      </td>
                      <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                        {r.ingredients_sans_prix > 0 && (
                          <span style={{ color: "#b7791f", fontSize: "0.8rem" }}>
                            ⚠️ {r.ingredients_sans_prix} sans prix
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Graphe taux de marge */}
            <div style={{ width: "100%", height: "400px", backgroundColor: "white", padding: "2rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", marginBottom: "2rem" }}>
              <h3 style={{ marginBottom: "1rem" }}>Taux de marge par recette (%)</h3>
              {coutsMatieres.filter(r => r.taux_marge != null).length === 0 ? (
                <p style={{ color: "#888" }}>Renseignez les prix de vente pour afficher les taux de marge.</p>
              ) : (
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={coutsMatieres.filter(r => r.taux_marge != null)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="recette_nom" angle={-20} textAnchor="end" interval={0} height={80} />
                    <YAxis unit="%" />
                    <Tooltip formatter={(v) => [`${v} %`, "Taux de marge"]} />
                    <Bar dataKey="taux_marge">
                      {coutsMatieres.filter(r => r.taux_marge != null).map((r) => (
                        <Cell key={r.recette_id} fill={couleurMarge(r.taux_marge)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Graphe coût matière vs prix vente */}
            <div style={{ width: "100%", height: "400px", backgroundColor: "white", padding: "2rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", marginBottom: "2rem" }}>
              <h3 style={{ marginBottom: "1rem" }}>Coût matière vs Prix de vente (€)</h3>
              {coutsMatieres.filter(r => r.prix_vente != null).length === 0 ? (
                <p style={{ color: "#888" }}>Renseignez les prix de vente pour afficher ce graphe.</p>
              ) : (
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={coutsMatieres.filter(r => r.prix_vente != null)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="recette_nom" angle={-20} textAnchor="end" interval={0} height={80} />
                    <YAxis unit=" €" />
                    <Tooltip formatter={(v) => [`${v} €`]} />
                    <Bar dataKey="cout_matiere" name="Coût matière" fill="#e53e3e" />
                    <Bar dataKey="marge" name="Marge" fill="#38a169" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Détail ingrédients d'une recette */}
            <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                <h3 style={{ margin: 0 }}>Détail des coûts par ingrédient</h3>
                <select
                  value={recetteDetailCout}
                  onChange={(e) => setRecetteDetailCout(e.target.value)}
                  style={{ padding: "0.6rem 1rem", borderRadius: "5px", border: "1px solid #ccc", fontSize: "0.95rem" }}
                >
                  {coutsMatieres.map(r => (
                    <option key={r.recette_id} value={String(r.recette_id)}>{r.recette_nom}</option>
                  ))}
                </select>
              </div>

              {chargementDetail ? (
                <p style={{ color: "#888" }}>Chargement...</p>
              ) : detailCout.length === 0 ? (
                <p style={{ color: "#888" }}>Aucun détail disponible.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr>
                      <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Ingrédient</th>
                      <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Quantité</th>
                      <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Prix unitaire</th>
                      <th style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>Coût</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailCout.map((ligne, i) => (
                      <tr key={i}>
                        <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem", fontWeight: "bold" }}>{ligne.produit_nom}</td>
                        <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>{ligne.quantite} {ligne.unite}</td>
                        <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem" }}>
                          {ligne.prix_unitaire != null
                            ? `${ligne.prix_unitaire} € / ${ligne.unite}`
                            : <span style={{ color: "#e53e3e", fontSize: "0.85rem" }}>⚠️ Prix manquant</span>
                          }
                        </td>
                        <td style={{ borderBottom: "1px solid #eee", padding: "0.75rem", fontWeight: "bold" }}>{ligne.cout_ingredient} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Statistiques;