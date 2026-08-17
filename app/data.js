// Contenido de la app: técnicas de psicología social y de pareja aplicadas
// al desarrollo personal y la conexión auténtica. Todas las técnicas están
// inspiradas en investigación publicada de psicólogos e investigadores
// reconocidos (ver campo "fuente" en cada tip).

const CATEGORIES = [
  { id: "confianza", label: "Confianza", icon: "flame" },
  { id: "comunicacion", label: "Comunicación", icon: "chat" },
  { id: "lenguaje-corporal", label: "Lenguaje corporal", icon: "body" },
  { id: "inteligencia-emocional", label: "Inteligencia emocional", icon: "heart" },
  { id: "conexion", label: "Conexión auténtica", icon: "link" },
  { id: "mentalidad", label: "Mentalidad", icon: "brain" },
];

const TIPS = [
  {
    id: 1,
    categoria: "confianza",
    titulo: "La confianza se entrena, no se espera",
    fuente: "Albert Bandura — Teoría de la autoeficacia (1977, 1997)",
    resumen:
      "Bandura demostró que la confianza (\"autoeficacia\") no nace de sentirte seguro, sino de acumular pequeñas victorias reales. Cada vez que actúas a pesar del miedo, tu cerebro registra evidencia de que puedes hacerlo.",
    accion:
      "Hoy fija una sola meta social pequeña y concreta: saludar, iniciar una conversación breve o sostener contacto visual 3 segundos más de lo habitual. La repetición, no la motivación, construye confianza real.",
  },
  {
    id: 2,
    categoria: "mentalidad",
    titulo: "Trata el rechazo como información, no como veredicto",
    fuente: "Carol Dweck — Mentalidad de crecimiento (Mindset, 2006)",
    resumen:
      "Dweck distingue entre mentalidad fija (\"o gusto o no gusto, y eso me define\") y mentalidad de crecimiento (\"cada interacción me da datos para mejorar\"). Quienes ven el rechazo como aprendizaje persisten y mejoran; quienes lo ven como sentencia, se paralizan.",
    accion:
      "Después de cualquier interacción que no salga como esperabas, anota una frase: \"Esto me enseñó ___\". Convierte el ego herido en un dato útil.",
  },
  {
    id: 3,
    categoria: "comunicacion",
    titulo: "Haz que la otra persona se sienta escuchada, no entrevistada",
    fuente: "Carl Rogers — Escucha activa y empatía incondicional (1951)",
    resumen:
      "Rogers, uno de los padres de la psicología humanista, mostró que las personas se sienten conectadas cuando perciben comprensión genuina, no cuando reciben preguntas en cadena. La clave es reflejar lo que escuchas antes de añadir tu opinión.",
    accion:
      "En tu próxima conversación, antes de responder, parafrasea en una frase lo que la otra persona acaba de decir (\"Entonces lo que más te frustró fue...\"). Luego continúa.",
  },
  {
    id: 4,
    categoria: "conexion",
    titulo: "La vulnerabilidad genuina construye cercanía más rápido que la perfección",
    fuente: "Brené Brown — Investigación sobre vulnerabilidad y conexión (2012)",
    resumen:
      "Brown documentó, tras más de una década de estudio, que mostrarse honesto sobre miedos, dudas o errores propios —sin victimismo— genera confianza mucho más rápido que proyectar una imagen perfecta.",
    accion:
      "Comparte algo real sobre ti (una torpeza, una duda, un aprendizaje) en vez de solo presentar logros. La honestidad calibrada es magnética; la perfección performativa distancia.",
  },
  {
    id: 5,
    categoria: "conexion",
    titulo: "La cercanía se construye con preguntas que profundizan gradualmente",
    fuente: "Arthur Aron — Estudio de las 36 preguntas para generar intimidad (1997)",
    resumen:
      "Aron demostró en su famoso experimento que la autorrevelación mutua y creciente (empezar con preguntas ligeras y avanzar a temas personales) genera cercanía emocional medible entre dos desconocidos.",
    accion:
      "En una conversación, alterna entre compartir algo tuyo y preguntar algo un poco más personal que la vez anterior. No fuerces el ritmo: deja que la reciprocidad marque el paso.",
  },
  {
    id: 6,
    categoria: "lenguaje-corporal",
    titulo: "Tu postura le habla a tu propio sistema nervioso primero",
    fuente: "Amy Cuddy — Investigación sobre posturas de poder (TED 2012, Harvard)",
    resumen:
      "Cuddy investigó cómo adoptar posturas abiertas y expandidas (hombros hacia atrás, ocupar espacio) durante dos minutos antes de una interacción social reduce el cortisol percibido y aumenta la sensación subjetiva de seguridad.",
    accion:
      "Dos minutos antes de socializar, párate erguido, hombros relajados hacia atrás, respira profundo. No es \"actuar\": es preparar tu propio estado interno.",
  },
  {
    id: 7,
    categoria: "lenguaje-corporal",
    titulo: "La calidez no verbal se nota antes que cualquier palabra",
    fuente: "Albert Mehrabian — Comunicación no verbal (1971)",
    resumen:
      "Mehrabian mostró que en mensajes emocionalmente ambiguos, el tono de voz y el lenguaje corporal pesan más que las palabras exactas. Una sonrisa genuina, un tono cálido y una postura relajada comunican interés antes de que digas nada memorable.",
    accion:
      "Antes de preocuparte por \"qué decir\", cuida cómo lo dices: sonríe con los ojos, baja el ritmo de tu voz y evita cruzar los brazos.",
  },
  {
    id: 8,
    categoria: "inteligencia-emocional",
    titulo: "Nombra la emoción, no solo el hecho",
    fuente: "Daniel Goleman — Inteligencia emocional (1995)",
    resumen:
      "Goleman popularizó la evidencia de que reconocer y verbalizar emociones (propias y ajenas) —en lugar de solo describir eventos— crea conexiones más profundas y reduce malentendidos.",
    accion:
      "Cuando alguien te cuente algo, en vez de responder solo al hecho (\"qué mala suerte\"), nombra la emoción probable (\"suena que eso te dejó agotado/a\"). Se siente entendido de verdad.",
  },
  {
    id: 9,
    categoria: "conexion",
    titulo: "Cuida la proporción entre lo positivo y lo negativo",
    fuente: "John Gottman — \"Proporción mágica\" 5:1 (Instituto Gottman, décadas de investigación)",
    resumen:
      "Gottman, tras estudiar miles de parejas, encontró que las relaciones estables mantienen una proporción de al menos 5 interacciones positivas (humor, aprecio, interés genuino) por cada interacción negativa (crítica, sarcasmo, indiferencia).",
    accion:
      "En cada conversación o cita, procura que las bromas, el aprecio genuino y el interés real superen ampliamente cualquier queja, sarcasmo o comentario negativo.",
  },
  {
    id: 10,
    categoria: "comunicacion",
    titulo: "El humor compartido es un atajo hacia la cercanía",
    fuente: "John Gottman — Mapas de amor y humor compartido (Instituto Gottman)",
    resumen:
      "Gottman identificó el humor compartido como uno de los predictores más fuertes de conexión duradera: reír juntos sincroniza estados emocionales y baja las defensas naturales de ambas personas.",
    accion:
      "No fuerces chistes preparados. Busca el humor genuino en lo que ya está pasando en la conversación: es más auténtico y conecta mejor.",
  },
  {
    id: 11,
    categoria: "inteligencia-emocional",
    titulo: "Regula tu ansiedad antes de interpretar la situación",
    fuente: "Helen Fisher — Neurociencia de la atracción (Rutgers University)",
    resumen:
      "Fisher, antropóloga biológica, mostró que los estados de ansiedad elevada distorsionan la lectura social: interpretamos neutralidad como rechazo con más frecuencia cuando estamos nerviosos. Regular el cuerpo mejora el juicio social.",
    accion:
      "Si notas ansiedad alta, haz 3 respiraciones lentas (4 segundos inhalar, 6 exhalar) antes de decidir cómo interpretar una reacción ambigua. Rara vez es tan negativa como parece bajo estrés.",
  },
  {
    id: 12,
    categoria: "comunicacion",
    titulo: "La curiosidad genuina vale más que las líneas ensayadas",
    fuente: "Elaine Hatfield — Teoría del amor pasional y contagio emocional (1993)",
    resumen:
      "Hatfield investigó el \"contagio emocional\": tendemos a reflejar el estado emocional de quien tenemos enfrente. El interés genuino y curioso es contagioso; el discurso ensayado se percibe como artificial y genera distancia.",
    accion:
      "Cambia \"¿qué le digo?\" por \"¿qué querría genuinamente saber de esta persona?\". Las mejores preguntas nacen de curiosidad real, no de un guion.",
  },
  {
    id: 13,
    categoria: "mentalidad",
    titulo: "Actúa según tus valores, no según el resultado que esperas obtener",
    fuente: "Viktor Frankl — Logoterapia y sentido (El hombre en busca de sentido, 1946)",
    resumen:
      "Frankl mostró que el bienestar duradero viene de actuar alineado con un propósito y valores propios, no de perseguir resultados externos. Cuando socializas para \"conseguir algo\", se percibe necesidad; cuando lo haces desde tus valores (curiosidad, respeto, disfrute), se percibe autenticidad.",
    accion:
      "Antes de una interacción, pregúntate: \"¿Cómo quiero comportarme, sin importar el resultado?\". Conecta con eso, no con la ansiedad por el desenlace.",
  },
  {
    id: 14,
    categoria: "confianza",
    titulo: "La autocompasión sostiene la confianza mejor que la autoexigencia",
    fuente: "Kristin Neff — Investigación sobre autocompasión (2003)",
    resumen:
      "Neff demostró que las personas que se tratan con autocompasión (hablarse con la misma amabilidad que a un amigo) se recuperan más rápido de reveses sociales y mantienen mejor su autoestima a largo plazo que quienes se autocritican duramente.",
    accion:
      "Después de un momento incómodo, en vez de rumiar con autocrítica, pregúntate: \"¿Qué le diría a un buen amigo en mi lugar?\". Dítelo a ti mismo.",
  },
  {
    id: 15,
    categoria: "conexion",
    titulo: "El respeto y el consentimiento son la base de cualquier conexión real",
    fuente: "Abraham Maslow — Jerarquía de necesidades: pertenencia y amor (1943)",
    resumen:
      "Maslow ubicó el amor y la pertenencia como necesidades humanas fundamentales, pero construidas sobre seguridad y respeto mutuo. Ninguna técnica de conexión funciona si ignora los límites, el ritmo o la voluntad de la otra persona.",
    accion:
      "Lee y respeta las señales de interés o desinterés. Si hay ambigüedad, pregunta directamente y con calidez. El respeto explícito nunca resta atractivo: lo confirma.",
  },
  {
    id: 16,
    categoria: "lenguaje-corporal",
    titulo: "La sincronía corporal sutil genera cercanía sin que nadie la note",
    fuente: "Frank Bernieri — Investigación sobre \"rapport\" y sincronía no verbal (1988)",
    resumen:
      "Bernieri encontró que cuando dos personas coordinan sutilmente su postura, ritmo de habla o gestos, ambas reportan sentir más conexión, incluso sin ser conscientes de la sincronía.",
    accion:
      "Nota el ritmo de voz y energía de la otra persona y ajústate levemente (sin imitar de forma obvia). Es una forma silenciosa de decir \"estoy en sintonía contigo\".",
  },
  {
    id: 17,
    categoria: "mentalidad",
    titulo: "Diversifica dónde depositas tu autoestima",
    fuente: "Jennifer Crocker — Contingencias de la autoestima (2001)",
    resumen:
      "Crocker mostró que cuando la autoestima depende de un solo ámbito (por ejemplo, ser aceptado románticamente), cada interacción se vuelve de alto riesgo emocional. Quienes construyen autoestima desde múltiples fuentes (amistades, logros, hobbies) afrontan el terreno social con más calma.",
    accion:
      "Invierte esta semana tiempo en algo que te haga sentir competente fuera del ámbito romántico: un proyecto, deporte o habilidad. Reduce la presión en cada interacción social.",
  },
  {
    id: 18,
    categoria: "inteligencia-emocional",
    titulo: "El deseo se sostiene con espacio, no solo con cercanía constante",
    fuente: "Esther Perel — El dilema de la intimidad y el deseo (Mating in Captivity, 2006)",
    resumen:
      "Perel, terapeuta de pareja, argumenta que la atracción sostenida necesita tanto cercanía como autonomía: el misterio y el espacio propio mantienen vivo el interés tanto como la intimidad compartida.",
    accion:
      "No conviertas cada interacción en una búsqueda de validación constante. Mantén tu vida, intereses y ritmo propio: la autonomía genuina es atractiva.",
  },
  {
    id: 19,
    categoria: "comunicacion",
    titulo: "Habla de ti en primera persona, sin reproches",
    fuente: "Marshall Rosenberg — Comunicación no violenta (1999)",
    resumen:
      "Rosenberg desarrolló un modelo de comunicación centrado en expresar observaciones, sentimientos y necesidades propias sin culpar al otro, lo que reduce la defensividad y facilita el entendimiento mutuo.",
    accion:
      "Cambia \"tú nunca...\" por \"yo me siento... cuando...\". Es igual de honesto y genera muchísima menos defensividad.",
  },
  {
    id: 20,
    categoria: "confianza",
    titulo: "La exposición gradual reduce el miedo más que la fuerza de voluntad",
    fuente: "Joseph Wolpe — Desensibilización sistemática (1958)",
    resumen:
      "Wolpe, pionero de la terapia conductual, demostró que enfrentar gradualmente situaciones temidas —en pasos pequeños y manejables— reduce la ansiedad de forma mucho más duradera que \"forzarse\" de golpe o evitar por completo.",
    accion:
      "Si el acercamiento social te da miedo, no saltes al reto más grande. Empieza con interacciones de bajo riesgo (agradecer, comentar algo neutral) y sube de nivel semana a semana.",
  },
];

const QUOTES = [
  {
    texto: "La autoeficacia no viene de sentirte listo. Viene de actuar antes de sentirte listo.",
    autor: "Inspirado en Albert Bandura",
  },
  {
    texto: "No eres tus fracasos sociales. Eres los datos que decides extraer de ellos.",
    autor: "Inspirado en Carol Dweck",
  },
  {
    texto: "La conexión real empieza cuando dejas de actuar un personaje y te muestras, con cuidado, tal como eres.",
    autor: "Inspirado en Brené Brown",
  },
  {
    texto: "Escuchar de verdad es el acto de generosidad más atractivo que existe.",
    autor: "Inspirado en Carl Rogers",
  },
  {
    texto: "El respeto no le resta magnetismo a nadie. Se lo da.",
    autor: "Inspirado en Abraham Maslow",
  },
  {
    texto: "La confianza es un músculo: se entrena con repeticiones pequeñas, no con un golpe de suerte.",
    autor: "Inspirado en Albert Bandura",
  },
];
