const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route pour recevoir le formulaire
app.post('/api/atomy-contact', async (req, res) => {
  try {
    const { nom, email, telephone, message, source, parrain, pays } = req.body;

    // 1️⃣ Email de notification pour toi
    const brevoData = {
      sender: {
        name: "ATOMY MaviServices",
        email: "maviservices20@gmail.com"
      },
      to: [
        {
          email: "maviservices20@gmail.com",
          name: "Laurent - ATOMY"
        }
      ],
      subject: `📬 Nouveau contact ATOMY - ${nom}`,
      htmlContent: `
        <h2>🌿 Nouveau contact ATOMY</h2>
        <p><strong>Nom :</strong> ${nom}</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Téléphone :</strong> ${telephone || 'Non renseigné'}</p>
        <p><strong>Source :</strong> ${source || 'Site web'}</p>
        <p><strong>Message :</strong></p>
        <blockquote>${message}</blockquote>
        <hr>
        <small>Reçu le ${new Date().toLocaleString('fr-FR')}</small>
      `,
      tags: ["atomy", "contact", "maviservices"]
    };

    // Envoi email notification
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      brevoData,
      {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': process.env.BREVO_API_KEY
        }
      }
    );

    // 2️⃣ AJOUT DU CONTACT À LA LISTE BREVO (NOUVEAU !)
    const listId = parseInt(process.env.BREVO_LIST_ID) || 2;
    
    await axios.post(
      'https://api.brevo.com/v3/contacts',
      {
        email: email,
        listIds: [listId],
       attributes: {
  NOM: nom,
  PRENOM: nom.split(' ')[0] || '',
  TELEPHONE: telephone || '',
  SOURCE: source || 'Tunnel ATOMY',
  PARRAIN: req.body.parrain || 'Non renseigné',
  PAYS: req.body.pays || 'Non renseigné'
},
        updateEnabled: true // Met à jour si le contact existe déjà
      },
      {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': process.env.BREVO_API_KEY
        }
      }
    );

    console.log(`✅ Contact ${email} ajouté à la liste ${listId}`);

    // Réponse succès
    res.status(200).json({
      success: true,
      message: 'Contact enregistré avec succès',
      email: email
    });

  } catch (error) {
    console.error('❌ Erreur Brevo:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement',
      error: error.message
    });
  }
});

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'atomy-brevo-proxy' });
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy Brevo démarré sur le port ${PORT}`);
});
