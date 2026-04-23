export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-zinc-100">
      <h1 className="text-2xl font-semibold">Politique de confidentialité</h1>

      <section className="mt-4 space-y-4 text-sm text-zinc-300">
        <p>
          Nebula Dream accorde une grande importance à la protection des données personnelles.
          Cette politique explique de façon claire quelles données sont collectées, pourquoi elles
          sont utilisées et comment elles sont protégées.
        </p>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">1. Données collectées</h2>
          <p>
            Nous collectons uniquement les informations nécessaires au fonctionnement du service,
            notamment : nom, adresse email et informations liées aux achats.
          </p>
          <p>
            Les informations de paiement sont traitées de manière sécurisée par Stripe et ne sont
            pas stockées par Nebula Dream.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">2. Utilisation des données</h2>
          <p>Les données sont utilisées uniquement pour :</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>la création et la gestion du compte</li>
            <li>le traitement des paiements</li>
            <li>la livraison des fichiers audio</li>
            <li>l&apos;envoi d&apos;emails liés au service (confirmation, accès aux produits)</li>
            <li>la sécurité du service et la prévention des usages frauduleux</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">3. Partage des données</h2>
          <p>Les données ne sont jamais revendues.</p>
          <p>
            Elles peuvent être partagées uniquement avec des services essentiels au fonctionnement
            du site (ex : Stripe pour les paiements, hébergement).
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">4. Stockage et sécurité</h2>
          <p>
            Des mesures de sécurité sont mises en place afin de protéger les données contre tout
            accès non autorisé.
          </p>
          <p>
            Nous limitons l&apos;accès aux informations personnelles aux seules personnes et services
            nécessaires au fonctionnement de Nebula Dream.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">5. Vos droits</h2>
          <p>
            L&apos;utilisateur peut demander l&apos;accès, la modification ou la suppression de ses données
            en contactant Nebula Dream via la page Contact.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">6. Modifications</h2>
          <p>
            Nebula Dream se réserve le droit de modifier cette politique à tout moment. La version
            publiée sur le site est la version en vigueur.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-100">7. Loi applicable</h2>
          <p>Cette politique est régie par les lois en vigueur au Canada.</p>
        </div>
      </section>
    </main>
  );
}
