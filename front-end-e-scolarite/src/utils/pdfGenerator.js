const printWindow = (html) => {
  const win = window.open('', '_blank', 'width=800,height=900');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
};

const baseStyle = `
  body { font-family: Arial, sans-serif; margin: 60px; color: #000; font-size: 13px; line-height: 1.6; }
  .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
  .header h1 { font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0 0 4px; }
  .header p { margin: 2px 0; font-size: 12px; }
  .ref { text-align: right; margin-bottom: 30px; font-size: 12px; }
  .objet { margin-bottom: 24px; }
  .body-text p { margin: 0 0 14px; text-align: justify; }
  .signature { margin-top: 60px; }
  .signature .city-date { margin-bottom: 40px; }
  .signature .name { font-weight: bold; }
  @media print { body { margin: 30px; } }
`;

export const generateLettreAppuiStage = ({ demande, chefName, deptName }) => {
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const etudiant = demande.etudiant_details;
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Lettre d'Appui - Stage</title><style>${baseStyle}</style></head><body>
    <div class="header">
      <h1>Ecole Nationale Polytechnique</h1>
      <p>Departement : ${deptName || 'Non specifie'}</p>
    </div>
    <div class="ref">
      <p>Ref : POLY/${deptName?.substring(0, 4).toUpperCase() || 'DEPT'}/APPUI-STAGE/${demande.id}</p>
      <p>Date : ${date}</p>
    </div>
    <p style="margin-bottom:28px;"><strong>A qui de droit</strong></p>
    <div class="objet">
      <strong>Objet : Lettre d'appui pour demande de stage</strong>
    </div>
    <div class="body-text">
      <p>Nous soussigne, Chef du Departement de <strong>${deptName || '...'}</strong> de l'Ecole Nationale Polytechnique, attestons par la presente que :</p>
      <p>M./Mme <strong>${etudiant.prenom} ${etudiant.nom}</strong>, portant le matricule <strong>${etudiant.matricule}</strong>, est regulierement inscrit(e) dans notre institution pour l'annee universitaire en cours.</p>
      <p>Dans le cadre de son cursus academique, l'etudiant(e) souhaite effectuer un stage au sein de votre structure. Le motif exprime est le suivant :</p>
      <p style="font-style:italic; border-left: 3px solid #000; padding-left: 14px;">${demande.motif || 'Demande de soutien institutionnel pour stage academique.'}</p>
      <p>Nous sollicitons votre bienveillante consideration et appuyons la demarche de notre etudiant(e) aupres de votre etablissement.</p>
      <p>Veuillez agreer, a qui de droit, l'expression de nos salutations distinguees.</p>
    </div>
    <div class="signature">
      <div class="city-date">Fait a Yaounde, le ${date}</div>
      <div>Le Chef de Departement de ${deptName || '...'}</div>
      <br/><br/><br/>
      <div class="name">${chefName || '...'}</div>
    </div>
  </body></html>`;
  printWindow(html);
};

export const generateAttestationStage = ({ demande, chefName, deptName }) => {
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const etudiant = demande.etudiant_details;
  const dateDebut = demande.date_debut ? new Date(demande.date_debut).toLocaleDateString('fr-FR') : '...';
  const dateFin = demande.date_fin ? new Date(demande.date_fin).toLocaleDateString('fr-FR') : '...';
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Attestation de Stage</title><style>${baseStyle}</style></head><body>
    <div class="header">
      <h1>Ecole Nationale Polytechnique</h1>
      <p>Departement : ${deptName || 'Non specifie'}</p>
    </div>
    <div class="ref">
      <p>Ref : POLY/${deptName?.substring(0, 4).toUpperCase() || 'DEPT'}/ATTEST-STAGE/${demande.id}</p>
      <p>Date : ${date}</p>
    </div>
    <h2 style="text-align:center; text-transform:uppercase; margin: 40px 0; font-size:15px; letter-spacing:1px;">Attestation de Stage</h2>
    <div class="body-text">
      <p>Le Chef du Departement de <strong>${deptName || '...'}</strong> de l'Ecole Nationale Polytechnique atteste que :</p>
      <p>M./Mme <strong>${etudiant.prenom} ${etudiant.nom}</strong>, matricule <strong>${etudiant.matricule}</strong>, etudiant(e) regulierement inscrit(e) dans notre departement, est autorise(e) a effectuer un stage academique :</p>
      <table style="width:100%; border-collapse:collapse; margin: 20px 0;">
        <tr><td style="padding:6px 0; font-weight:bold; width:40%;">Entreprise / Structure :</td><td>${demande.entreprise || '...'}</td></tr>
        <tr><td style="padding:6px 0; font-weight:bold;">Poste / Fonction :</td><td>${demande.poste || '...'}</td></tr>
        <tr><td style="padding:6px 0; font-weight:bold;">Periode :</td><td>Du ${dateDebut} au ${dateFin}</td></tr>
      </table>
      <p>Ce stage s'inscrit dans le cadre de la formation pratique prevue par le programme academique du departement.</p>
      <p>La presente attestation est delivree pour servir et valoir ce que de droit.</p>
    </div>
    <div class="signature">
      <div class="city-date">Fait a Yaounde, le ${date}</div>
      <div>Le Chef de Departement de ${deptName || '...'}</div>
      <br/><br/><br/>
      <div class="name">${chefName || '...'}</div>
    </div>
  </body></html>`;
  printWindow(html);
};
