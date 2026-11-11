// Réglages du système de checklist automatique.
// Après une modification ici (ou l'ajout d'une checklist), relancer : bun run build

export default {
  // Dossier Dropbox qui contient les checklists (un sous-dossier par famille d'avion).
  checklistDir: 'D:/Dropbox/SIMULATION/Checklist et Phraséologie',

  // Page générée, écrite dans checklistDir. C'est le fichier chargé par la source OBS.
  outputFile: 'checklist-auto.html',

  // Compte SimBrief (username ou userid numérique).
  simbrief: 'SkyflyerAviation',

  // Relecture du plan SimBrief toutes les N secondes (et à chaque affichage de la source).
  refreshSeconds: 60,

  // Cadre autour de la checklist (remplace le filtre "User-defined shader" d'OBS).
  border: { width: 2, color: '#1099DF' },

  // Taille de la source navigateur dans OBS (= taille de l'ancienne image à l'écran).
  size: { width: 662, height: 948 },

  // Chaque sous-dossier : types ICAO SimBrief (aircraft.icaocode) qui l'utilisent.
  // `fallback` (facultatif) : fichier affiché si aucune checklist ne correspond à la
  // compagnie. Sans fallback : la checklist générique du dossier (fichier sans nom de
  // compagnie), sinon la première par ordre alphabétique.
  folders: {
    'AIRBUS A-320': { types: ['A318', 'A319', 'A320', 'A321', 'A19N', 'A20N', 'A21N'] },
    'BOEING 737Ng': { types: ['B736', 'B737', 'B738', 'B739'] },
    'BOEING 737MAX': { types: ['B37M', 'B38M', 'B39M', 'B3XM'] },
    'EMBRAER E-JET': { types: ['E170', 'E75S', 'E75L', 'E190', 'E195', 'E290', 'E295'] },
    'AIRBUS A-310': { types: ['A306', 'A30B', 'A310'] },
    'AIRBUS A-340': { types: ['A342', 'A343', 'A345', 'A346'] },
  },

  // Code ICAO compagnie (début du callsign) → nom tel qu'il apparaît dans le nom du fichier.
  // Pour une compagnie absente de cette liste : l'ajouter ici, ou mettre son code entre
  // parenthèses dans le nom du fichier, ex : "Airbus A-320 - VUELING (VLG).png".
  airlines: {
    EIN: ['AER LINGUS'], EUK: ['AER LINGUS'],
    AFR: ['AIR FRANCE'],
    BAW: ['BRITISH AIRWAYS'], SHT: ['BRITISH AIRWAYS'], EFW: ['BRITISH AIRWAYS'],
    EZY: ['EASYJET'], EJU: ['EASYJET'], EZS: ['EASYJET'],
    EWG: ['EUROWINGS'], EWL: ['EUROWINGS'],
    IBE: ['IBERIA'], IBS: ['IBERIA'],
    LAN: ['LATAM'], TAM: ['LATAM'], LPE: ['LATAM'], LNE: ['LATAM'], ARE: ['LATAM'], LXP: ['LATAM'],
    SWR: ['SWISS'],
    ASL: ['AIR SERBIA'],
    AXM: ['AIR ASIA'], AIQ: ['AIR ASIA'], AWQ: ['AIR ASIA'], APG: ['AIR ASIA'],
    AFL: ['AEROFLOT'],
    SEY: ['AIR SEYCHELLES'],
    ANA: ['ANA', 'ALL NIPPON'],
    CES: ['CHINA EASTERN'],
    DLH: ['LUFTHANSA'], CLH: ['LUFTHANSA'],
    QTR: ['QATAR AIRWAYS', 'QATAR'],
    THA: ['THAI'],
    DAH: ['AIR ALGERIE'],
    AEA: ['AIR EUROPA'],
    ASA: ['ALASKA'],
    ABR: ['ASL'], TAY: ['ASL'], FPO: ['ASL'],
    NAX: ['NORWEGIAN'], NSZ: ['NORWEGIAN'], NOZ: ['NORWEGIAN'], IBK: ['NORWEGIAN'],
    RYR: ['RYANAIR'], RUK: ['RYANAIR'], MAY: ['RYANAIR'], RYS: ['RYANAIR'], LDM: ['RYANAIR'],
    ROT: ['TAROM'],
    TRA: ['TRANSAVIA'], TVF: ['TRANSAVIA'],
    THY: ['TURKISH AIRLINES', 'TURKISH'],
    UAL: ['UNITED'],
    BCS: ['DHL'], DHK: ['DHL'], DAE: ['DHL'], DHX: ['DHL'],
    FDX: ['FEDEX'],
    LOT: ['LOT'],
  },
};
