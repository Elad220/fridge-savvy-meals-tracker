export type SupportedLanguage = 
  | 'English' | 'Hebrew' | 'Spanish' | 'French' | 'German' | 'Italian'
  | 'Portuguese' | 'Russian' | 'Chinese' | 'Japanese' | 'Korean' | 'Arabic';

interface LocalizedMessages {
  // AI-related messages
  aiModelOverloaded: string;
  aiModelOverloadedDescription: string;
  aiRecommendationsError: string;
  aiRecommendationsErrorDescription: string;
  languagePreferenceSaved: string;
  languagePreferenceSavedDescription: string;
  errorSavingLanguage: string;
  errorSavingLanguageDescription: string;
  
  // Analysis messages
  analysisComplete: string;
  analysisCompleteDescription: string;
  analysisFailed: string;
  analysisFailedDescription: string;
  noImagesSelected: string;
  noImagesSelectedDescription: string;
  recordingStarted: string;
  recordingStartedDescription: string;
  recordingStopped: string;
  recordingStoppedDescription: string;
  recordingFailed: string;
  recordingFailedDescription: string;
  noRecordingFound: string;
  noRecordingFoundDescription: string;
  
  // Recipe messages
  recipesGenerated: string;
  recipesGeneratedDescription: string;
  errorGeneratingRecipes: string;
  errorGeneratingRecipesDescription: string;
  recipeAddedToMealPlan: string;
  recipeAddedToMealPlanDescription: string;
  
  // General messages
  error: string;
  success: string;
  warning: string;
  info: string;
  dismiss: string;
  add: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  loading: string;
  retry: string;
  
  // Time units
  minutes: string;
  hours: string;
  days: string;
  
  // Difficulty levels
  easy: string;
  medium: string;
  hard: string;
  
  // Priority levels
  highPriority: string;
  mediumPriority: string;
  lowPriority: string;
}

const messages: Record<SupportedLanguage, LocalizedMessages> = {
  English: {
    aiModelOverloaded: "AI Model Overloaded",
    aiModelOverloadedDescription: "The AI model is currently overloaded. Please try again in a few minutes.",
    aiRecommendationsError: "Error",
    aiRecommendationsErrorDescription: "Failed to generate AI recommendations. Please try again later.",
    languagePreferenceSaved: "Language preference saved",
    languagePreferenceSavedDescription: "AI responses will now be in {language}.",
    errorSavingLanguage: "Error saving language preference",
    errorSavingLanguageDescription: "{error}",
    
    analysisComplete: "Analysis complete",
    analysisCompleteDescription: "Detected {count} item{plural}. Review and edit the details before adding.",
    analysisFailed: "Analysis failed",
    analysisFailedDescription: "{error}",
    noImagesSelected: "No images selected",
    noImagesSelectedDescription: "Please select or take at least one photo.",
    recordingStarted: "Recording started",
    recordingStartedDescription: "Speak clearly about the items you want to add to your inventory.",
    recordingStopped: "Recording stopped",
    recordingStoppedDescription: "You can now play back your recording or analyze it.",
    recordingFailed: "Recording failed",
    recordingFailedDescription: "Could not access microphone. Please check your permissions.",
    noRecordingFound: "No recording found",
    noRecordingFoundDescription: "Please record your voice first.",
    
    recipesGenerated: "Recipes generated!",
    recipesGeneratedDescription: "Found {count} recipes for your ingredients.",
    errorGeneratingRecipes: "Error generating recipes",
    errorGeneratingRecipesDescription: "{error}",
    recipeAddedToMealPlan: "Recipe added to meal plan!",
    recipeAddedToMealPlanDescription: "{recipeName} has been added to your meal plans.",
    
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Info",
    dismiss: "Dismiss",
    add: "Add",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    loading: "Loading...",
    retry: "Retry",
    
    minutes: "minutes",
    hours: "hours",
    days: "days",
    
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    
    highPriority: "high",
    mediumPriority: "medium",
    lowPriority: "low",
  },
  
  Hebrew: {
    aiModelOverloaded: "מודל AI עמוס",
    aiModelOverloadedDescription: "מודל ה-AI עמוס כרגע. אנא נסה שוב בעוד כמה דקות.",
    aiRecommendationsError: "שגיאה",
    aiRecommendationsErrorDescription: "נכשל ביצירת המלצות AI. אנא נסה שוב מאוחר יותר.",
    languagePreferenceSaved: "העדפת שפה נשמרה",
    languagePreferenceSavedDescription: "תגובות AI יהיו כעת ב-{language}.",
    errorSavingLanguage: "שגיאה בשמירת העדפת שפה",
    errorSavingLanguageDescription: "{error}",
    
    analysisComplete: "הניתוח הושלם",
    analysisCompleteDescription: "זוהו {count} פריט{plural}. סקור וערוך את הפרטים לפני הוספה.",
    analysisFailed: "הניתוח נכשל",
    analysisFailedDescription: "{error}",
    noImagesSelected: "לא נבחרו תמונות",
    noImagesSelectedDescription: "אנא בחר או צלם לפחות תמונה אחת.",
    recordingStarted: "ההקלטה החלה",
    recordingStartedDescription: "דבר בבירור על הפריטים שברצונך להוסיף למלאי.",
    recordingStopped: "ההקלטה הופסקה",
    recordingStoppedDescription: "כעת תוכל לנגן את ההקלטה או לנתח אותה.",
    recordingFailed: "ההקלטה נכשלה",
    recordingFailedDescription: "לא ניתן לגשת למיקרופון. אנא בדוק את ההרשאות שלך.",
    noRecordingFound: "לא נמצאה הקלטה",
    noRecordingFoundDescription: "אנא הקלט את קולך תחילה.",
    
    recipesGenerated: "המתכונים נוצרו!",
    recipesGeneratedDescription: "נמצאו {count} מתכונים עבור המרכיבים שלך.",
    errorGeneratingRecipes: "שגיאה ביצירת מתכונים",
    errorGeneratingRecipesDescription: "{error}",
    recipeAddedToMealPlan: "המתכון נוסף לתוכנית הארוחות!",
    recipeAddedToMealPlanDescription: "{recipeName} נוסף לתוכניות הארוחות שלך.",
    
    error: "שגיאה",
    success: "הצלחה",
    warning: "אזהרה",
    info: "מידע",
    dismiss: "ביטול",
    add: "הוסף",
    save: "שמור",
    cancel: "ביטול",
    edit: "ערוך",
    delete: "מחק",
    loading: "טוען...",
    retry: "נסה שוב",
    
    minutes: "דקות",
    hours: "שעות",
    days: "ימים",
    
    easy: "קל",
    medium: "בינוני",
    hard: "קשה",
    
    highPriority: "גבוה",
    mediumPriority: "בינוני",
    lowPriority: "נמוך",
  },
  
  Spanish: {
    aiModelOverloaded: "Modelo AI Sobrecargado",
    aiModelOverloadedDescription: "El modelo AI está sobrecargado actualmente. Por favor, inténtalo de nuevo en unos minutos.",
    aiRecommendationsError: "Error",
    aiRecommendationsErrorDescription: "Error al generar recomendaciones AI. Por favor, inténtalo de nuevo más tarde.",
    languagePreferenceSaved: "Preferencia de idioma guardada",
    languagePreferenceSavedDescription: "Las respuestas AI ahora serán en {language}.",
    errorSavingLanguage: "Error al guardar preferencia de idioma",
    errorSavingLanguageDescription: "{error}",
    
    analysisComplete: "Análisis completo",
    analysisCompleteDescription: "Detectados {count} elemento{plural}. Revisa y edita los detalles antes de agregar.",
    analysisFailed: "Análisis fallido",
    analysisFailedDescription: "{error}",
    noImagesSelected: "No se seleccionaron imágenes",
    noImagesSelectedDescription: "Por favor, selecciona o toma al menos una foto.",
    recordingStarted: "Grabación iniciada",
    recordingStartedDescription: "Habla claramente sobre los elementos que quieres agregar a tu inventario.",
    recordingStopped: "Grabación detenida",
    recordingStoppedDescription: "Ahora puedes reproducir tu grabación o analizarla.",
    recordingFailed: "Grabación fallida",
    recordingFailedDescription: "No se pudo acceder al micrófono. Por favor, verifica tus permisos.",
    noRecordingFound: "No se encontró grabación",
    noRecordingFoundDescription: "Por favor, graba tu voz primero.",
    
    recipesGenerated: "¡Recetas generadas!",
    recipesGeneratedDescription: "Se encontraron {count} recetas para tus ingredientes.",
    errorGeneratingRecipes: "Error al generar recetas",
    errorGeneratingRecipesDescription: "{error}",
    recipeAddedToMealPlan: "¡Receta agregada al plan de comidas!",
    recipeAddedToMealPlanDescription: "{recipeName} ha sido agregado a tus planes de comidas.",
    
    error: "Error",
    success: "Éxito",
    warning: "Advertencia",
    info: "Información",
    dismiss: "Descartar",
    add: "Agregar",
    save: "Guardar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Eliminar",
    loading: "Cargando...",
    retry: "Reintentar",
    
    minutes: "minutos",
    hours: "horas",
    days: "días",
    
    easy: "Fácil",
    medium: "Medio",
    hard: "Difícil",
    
    highPriority: "alto",
    mediumPriority: "medio",
    lowPriority: "bajo",
  },
  
  French: {
    aiModelOverloaded: "Modèle IA Surchargé",
    aiModelOverloadedDescription: "Le modèle IA est actuellement surchargé. Veuillez réessayer dans quelques minutes.",
    aiRecommendationsError: "Erreur",
    aiRecommendationsErrorDescription: "Échec de la génération des recommandations IA. Veuillez réessayer plus tard.",
    languagePreferenceSaved: "Préférence de langue enregistrée",
    languagePreferenceSavedDescription: "Les réponses IA seront maintenant en {language}.",
    errorSavingLanguage: "Erreur lors de l'enregistrement de la préférence de langue",
    errorSavingLanguageDescription: "{error}",
    
    analysisComplete: "Analyse terminée",
    analysisCompleteDescription: "Détecté {count} élément{plural}. Examinez et modifiez les détails avant d'ajouter.",
    analysisFailed: "Échec de l'analyse",
    analysisFailedDescription: "{error}",
    noImagesSelected: "Aucune image sélectionnée",
    noImagesSelectedDescription: "Veuillez sélectionner ou prendre au moins une photo.",
    recordingStarted: "Enregistrement démarré",
    recordingStartedDescription: "Parlez clairement des éléments que vous souhaitez ajouter à votre inventaire.",
    recordingStopped: "Enregistrement arrêté",
    recordingStoppedDescription: "Vous pouvez maintenant lire votre enregistrement ou l'analyser.",
    recordingFailed: "Échec de l'enregistrement",
    recordingFailedDescription: "Impossible d'accéder au microphone. Veuillez vérifier vos autorisations.",
    noRecordingFound: "Aucun enregistrement trouvé",
    noRecordingFoundDescription: "Veuillez d'abord enregistrer votre voix.",
    
    recipesGenerated: "Recettes générées !",
    recipesGeneratedDescription: "Trouvé {count} recettes pour vos ingrédients.",
    errorGeneratingRecipes: "Erreur lors de la génération de recettes",
    errorGeneratingRecipesDescription: "{error}",
    recipeAddedToMealPlan: "Recette ajoutée au plan de repas !",
    recipeAddedToMealPlanDescription: "{recipeName} a été ajouté à vos plans de repas.",
    
    error: "Erreur",
    success: "Succès",
    warning: "Avertissement",
    info: "Information",
    dismiss: "Rejeter",
    add: "Ajouter",
    save: "Enregistrer",
    cancel: "Annuler",
    edit: "Modifier",
    delete: "Supprimer",
    loading: "Chargement...",
    retry: "Réessayer",
    
    minutes: "minutes",
    hours: "heures",
    days: "jours",
    
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile",
    
    highPriority: "élevé",
    mediumPriority: "moyen",
    lowPriority: "faible",
  },
  
  German: {
    aiModelOverloaded: "KI-Modell Überlastet",
    aiModelOverloadedDescription: "Das KI-Modell ist derzeit überlastet. Bitte versuchen Sie es in einigen Minuten erneut.",
    aiRecommendationsError: "Fehler",
    aiRecommendationsErrorDescription: "Fehler beim Generieren von KI-Empfehlungen. Bitte versuchen Sie es später erneut.",
    languagePreferenceSaved: "Spracheinstellung gespeichert",
    languagePreferenceSavedDescription: "KI-Antworten werden jetzt in {language} sein.",
    errorSavingLanguage: "Fehler beim Speichern der Spracheinstellung",
    errorSavingLanguageDescription: "{error}",
    
    analysisComplete: "Analyse abgeschlossen",
    analysisCompleteDescription: "{count} Element{plural} erkannt. Überprüfen und bearbeiten Sie die Details vor dem Hinzufügen.",
    analysisFailed: "Analyse fehlgeschlagen",
    analysisFailedDescription: "{error}",
    noImagesSelected: "Keine Bilder ausgewählt",
    noImagesSelectedDescription: "Bitte wählen Sie mindestens ein Foto aus oder machen Sie eines.",
    recordingStarted: "Aufnahme gestartet",
    recordingStartedDescription: "Sprechen Sie deutlich über die Elemente, die Sie zu Ihrem Inventar hinzufügen möchten.",
    recordingStopped: "Aufnahme gestoppt",
    recordingStoppedDescription: "Sie können jetzt Ihre Aufnahme abspielen oder analysieren.",
    recordingFailed: "Aufnahme fehlgeschlagen",
    recordingFailedDescription: "Mikrofon konnte nicht zugegriffen werden. Bitte überprüfen Sie Ihre Berechtigungen.",
    noRecordingFound: "Keine Aufnahme gefunden",
    noRecordingFoundDescription: "Bitte nehmen Sie zuerst Ihre Stimme auf.",
    
    recipesGenerated: "Rezepte generiert!",
    recipesGeneratedDescription: "{count} Rezepte für Ihre Zutaten gefunden.",
    errorGeneratingRecipes: "Fehler beim Generieren von Rezepten",
    errorGeneratingRecipesDescription: "{error}",
    recipeAddedToMealPlan: "Rezept zum Mahlzeitenplan hinzugefügt!",
    recipeAddedToMealPlanDescription: "{recipeName} wurde zu Ihren Mahlzeitenplänen hinzugefügt.",
    
    error: "Fehler",
    success: "Erfolg",
    warning: "Warnung",
    info: "Info",
    dismiss: "Verwerfen",
    add: "Hinzufügen",
    save: "Speichern",
    cancel: "Abbrechen",
    edit: "Bearbeiten",
    delete: "Löschen",
    loading: "Lädt...",
    retry: "Wiederholen",
    
    minutes: "Minuten",
    hours: "Stunden",
    days: "Tage",
    
    easy: "Einfach",
    medium: "Mittel",
    hard: "Schwer",
    
    highPriority: "hoch",
    mediumPriority: "mittel",
    lowPriority: "niedrig",
  },
  
  Italian: {
    aiModelOverloaded: "Modello AI Sovraccarico",
    aiModelOverloadedDescription: "Il modello AI è attualmente sovraccarico. Riprova tra qualche minuto.",
    aiRecommendationsError: "Errore",
    aiRecommendationsErrorDescription: "Impossibile generare raccomandazioni AI. Riprova più tardi.",
    languagePreferenceSaved: "Preferenza lingua salvata",
    languagePreferenceSavedDescription: "Le risposte AI saranno ora in {language}.",
    errorSavingLanguage: "Errore nel salvare la preferenza lingua",
    errorSavingLanguageDescription: "{error}",
    
    analysisComplete: "Analisi completata",
    analysisCompleteDescription: "Rilevati {count} elemento{plural}. Rivedi e modifica i dettagli prima di aggiungere.",
    analysisFailed: "Analisi fallita",
    analysisFailedDescription: "{error}",
    noImagesSelected: "Nessuna immagine selezionata",
    noImagesSelectedDescription: "Seleziona o scatta almeno una foto.",
    recordingStarted: "Registrazione avviata",
    recordingStartedDescription: "Parla chiaramente degli elementi che vuoi aggiungere al tuo inventario.",
    recordingStopped: "Registrazione fermata",
    recordingStoppedDescription: "Ora puoi riprodurre la tua registrazione o analizzarla.",
    recordingFailed: "Registrazione fallita",
    recordingFailedDescription: "Impossibile accedere al microfono. Controlla le tue autorizzazioni.",
    noRecordingFound: "Nessuna registrazione trovata",
    noRecordingFoundDescription: "Registra prima la tua voce.",
    
    recipesGenerated: "Ricette generate!",
    recipesGeneratedDescription: "Trovate {count} ricette per i tuoi ingredienti.",
    errorGeneratingRecipes: "Errore nella generazione di ricette",
    errorGeneratingRecipesDescription: "{error}",
    recipeAddedToMealPlan: "Ricetta aggiunta al piano pasti!",
    recipeAddedToMealPlanDescription: "{recipeName} è stato aggiunto ai tuoi piani pasti.",
    
    error: "Errore",
    success: "Successo",
    warning: "Avviso",
    info: "Info",
    dismiss: "Scarta",
    add: "Aggiungi",
    save: "Salva",
    cancel: "Annulla",
    edit: "Modifica",
    delete: "Elimina",
    loading: "Caricamento...",
    retry: "Riprova",
    
    minutes: "minuti",
    hours: "ore",
    days: "giorni",
    
    easy: "Facile",
    medium: "Medio",
    hard: "Difficile",
    
    highPriority: "alto",
    mediumPriority: "medio",
    lowPriority: "basso",
  },
  
  Portuguese: {
    aiModelOverloaded: "Modelo IA Sobrecarregado",
    aiModelOverloadedDescription: "O modelo IA está atualmente sobrecarregado. Tente novamente em alguns minutos.",
    aiRecommendationsError: "Erro",
    aiRecommendationsErrorDescription: "Falha ao gerar recomendações IA. Tente novamente mais tarde.",
    languagePreferenceSaved: "Preferência de idioma salva",
    languagePreferenceSavedDescription: "As respostas IA agora serão em {language}.",
    errorSavingLanguage: "Erro ao salvar preferência de idioma",
    errorSavingLanguageDescription: "{error}",
    
    analysisComplete: "Análise completa",
    analysisCompleteDescription: "Detectados {count} item{plural}. Revise e edite os detalhes antes de adicionar.",
    analysisFailed: "Análise falhou",
    analysisFailedDescription: "{error}",
    noImagesSelected: "Nenhuma imagem selecionada",
    noImagesSelectedDescription: "Selecione ou tire pelo menos uma foto.",
    recordingStarted: "Gravação iniciada",
    recordingStartedDescription: "Fale claramente sobre os itens que deseja adicionar ao seu inventário.",
    recordingStopped: "Gravação parada",
    recordingStoppedDescription: "Agora você pode reproduzir sua gravação ou analisá-la.",
    recordingFailed: "Gravação falhou",
    recordingFailedDescription: "Não foi possível acessar o microfone. Verifique suas permissões.",
    noRecordingFound: "Nenhuma gravação encontrada",
    noRecordingFoundDescription: "Grave sua voz primeiro.",
    
    recipesGenerated: "Receitas geradas!",
    recipesGeneratedDescription: "Encontradas {count} receitas para seus ingredientes.",
    errorGeneratingRecipes: "Erro ao gerar receitas",
    errorGeneratingRecipesDescription: "{error}",
    recipeAddedToMealPlan: "Receita adicionada ao plano de refeições!",
    recipeAddedToMealPlanDescription: "{recipeName} foi adicionado aos seus planos de refeições.",
    
    error: "Erro",
    success: "Sucesso",
    warning: "Aviso",
    info: "Info",
    dismiss: "Descartar",
    add: "Adicionar",
    save: "Salvar",
    cancel: "Cancelar",
    edit: "Editar",
    delete: "Excluir",
    loading: "Carregando...",
    retry: "Tentar novamente",
    
    minutes: "minutos",
    hours: "horas",
    days: "dias",
    
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
    
    highPriority: "alto",
    mediumPriority: "médio",
    lowPriority: "baixo",
  },
  
  Russian: {
    aiModelOverloaded: "ИИ Модель Перегружена",
    aiModelOverloadedDescription: "Модель ИИ в настоящее время перегружена. Попробуйте еще раз через несколько минут.",
    aiRecommendationsError: "Ошибка",
    aiRecommendationsErrorDescription: "Не удалось сгенерировать рекомендации ИИ. Попробуйте позже.",
    languagePreferenceSaved: "Настройки языка сохранены",
    languagePreferenceSavedDescription: "Ответы ИИ теперь будут на {language}.",
    errorSavingLanguage: "Ошибка сохранения настроек языка",
    errorSavingLanguageDescription: "{error}",
    
    analysisComplete: "Анализ завершен",
    analysisCompleteDescription: "Обнаружено {count} элемент{plural}. Просмотрите и отредактируйте детали перед добавлением.",
    analysisFailed: "Анализ не удался",
    analysisFailedDescription: "{error}",
    noImagesSelected: "Изображения не выбраны",
    noImagesSelectedDescription: "Выберите или сделайте хотя бы одно фото.",
    recordingStarted: "Запись началась",
    recordingStartedDescription: "Говорите четко о предметах, которые хотите добавить в инвентарь.",
    recordingStopped: "Запись остановлена",
    recordingStoppedDescription: "Теперь вы можете воспроизвести запись или проанализировать ее.",
    recordingFailed: "Запись не удалась",
    recordingFailedDescription: "Не удалось получить доступ к микрофону. Проверьте разрешения.",
    noRecordingFound: "Запись не найдена",
    noRecordingFoundDescription: "Сначала запишите свой голос.",
    
    recipesGenerated: "Рецепты сгенерированы!",
    recipesGeneratedDescription: "Найдено {count} рецептов для ваших ингредиентов.",
    errorGeneratingRecipes: "Ошибка генерации рецептов",
    errorGeneratingRecipesDescription: "{error}",
    recipeAddedToMealPlan: "Рецепт добавлен в план питания!",
    recipeAddedToMealPlanDescription: "{recipeName} добавлен в ваши планы питания.",
    
    error: "Ошибка",
    success: "Успех",
    warning: "Предупреждение",
    info: "Информация",
    dismiss: "Отклонить",
    add: "Добавить",
    save: "Сохранить",
    cancel: "Отмена",
    edit: "Редактировать",
    delete: "Удалить",
    loading: "Загрузка...",
    retry: "Повторить",
    
    minutes: "минут",
    hours: "часов",
    days: "дней",
    
    easy: "Легко",
    medium: "Средне",
    hard: "Сложно",
    
    highPriority: "высокий",
    mediumPriority: "средний",
    lowPriority: "низкий",
  },
  
  Chinese: {
    aiModelOverloaded: "AI模型过载",
    aiModelOverloadedDescription: "AI模型目前过载。请几分钟后重试。",
    aiRecommendationsError: "错误",
    aiRecommendationsErrorDescription: "生成AI推荐失败。请稍后重试。",
    languagePreferenceSaved: "语言偏好已保存",
    languagePreferenceSavedDescription: "AI回复现在将使用{language}。",
    errorSavingLanguage: "保存语言偏好时出错",
    errorSavingLanguageDescription: "{error}",
    
    analysisComplete: "分析完成",
    analysisCompleteDescription: "检测到{count}个物品。在添加前请查看并编辑详细信息。",
    analysisFailed: "分析失败",
    analysisFailedDescription: "{error}",
    noImagesSelected: "未选择图片",
    noImagesSelectedDescription: "请选择或拍摄至少一张照片。",
    recordingStarted: "录音已开始",
    recordingStartedDescription: "清楚地说明您想要添加到库存的物品。",
    recordingStopped: "录音已停止",
    recordingStoppedDescription: "现在您可以播放录音或分析它。",
    recordingFailed: "录音失败",
    recordingFailedDescription: "无法访问麦克风。请检查您的权限。",
    noRecordingFound: "未找到录音",
    noRecordingFoundDescription: "请先录制您的声音。",
    
    recipesGenerated: "食谱已生成！",
    recipesGeneratedDescription: "为您的食材找到了{count}个食谱。",
    errorGeneratingRecipes: "生成食谱时出错",
    errorGeneratingRecipesDescription: "{error}",
    recipeAddedToMealPlan: "食谱已添加到膳食计划！",
    recipeAddedToMealPlanDescription: "{recipeName}已添加到您的膳食计划。",
    
    error: "错误",
    success: "成功",
    warning: "警告",
    info: "信息",
    dismiss: "忽略",
    add: "添加",
    save: "保存",
    cancel: "取消",
    edit: "编辑",
    delete: "删除",
    loading: "加载中...",
    retry: "重试",
    
    minutes: "分钟",
    hours: "小时",
    days: "天",
    
    easy: "简单",
    medium: "中等",
    hard: "困难",
    
    high: "高",
    medium: "中",
    low: "低",
  },
  
  Japanese: {
    aiModelOverloaded: "AIモデル過負荷",
    aiModelOverloadedDescription: "AIモデルが現在過負荷です。数分後に再試行してください。",
    aiRecommendationsError: "エラー",
    aiRecommendationsErrorDescription: "AI推奨の生成に失敗しました。後でもう一度お試しください。",
    languagePreferenceSaved: "言語設定が保存されました",
    languagePreferenceSavedDescription: "AIの応答は今後{language}で行われます。",
    errorSavingLanguage: "言語設定の保存中にエラーが発生しました",
    errorSavingLanguageDescription: "{error}",
    
    analysisComplete: "分析完了",
    analysisCompleteDescription: "{count}個のアイテムを検出しました。追加前に詳細を確認・編集してください。",
    analysisFailed: "分析に失敗しました",
    analysisFailedDescription: "{error}",
    noImagesSelected: "画像が選択されていません",
    noImagesSelectedDescription: "少なくとも1枚の写真を選択または撮影してください。",
    recordingStarted: "録音開始",
    recordingStartedDescription: "在庫に追加したいアイテムについて明確に話してください。",
    recordingStopped: "録音停止",
    recordingStoppedDescription: "録音を再生または分析できるようになりました。",
    recordingFailed: "録音に失敗しました",
    recordingFailedDescription: "マイクにアクセスできません。権限を確認してください。",
    noRecordingFound: "録音が見つかりません",
    noRecordingFoundDescription: "先に音声を録音してください。",
    
    recipesGenerated: "レシピが生成されました！",
    recipesGeneratedDescription: "材料に{count}個のレシピが見つかりました。",
    errorGeneratingRecipes: "レシピ生成中にエラーが発生しました",
    errorGeneratingRecipesDescription: "{error}",
    recipeAddedToMealPlan: "レシピが食事計画に追加されました！",
    recipeAddedToMealPlanDescription: "{recipeName}が食事計画に追加されました。",
    
    error: "エラー",
    success: "成功",
    warning: "警告",
    info: "情報",
    dismiss: "却下",
    add: "追加",
    save: "保存",
    cancel: "キャンセル",
    edit: "編集",
    delete: "削除",
    loading: "読み込み中...",
    retry: "再試行",
    
    minutes: "分",
    hours: "時間",
    days: "日",
    
    easy: "簡単",
    medium: "普通",
    hard: "難しい",
    
    high: "高",
    medium: "中",
    low: "低",
  },
  
  Korean: {
    aiModelOverloaded: "AI 모델 과부하",
    aiModelOverloadedDescription: "AI 모델이 현재 과부하 상태입니다. 몇 분 후에 다시 시도해 주세요.",
    aiRecommendationsError: "오류",
    aiRecommendationsErrorDescription: "AI 추천 생성에 실패했습니다. 나중에 다시 시도해 주세요.",
    languagePreferenceSaved: "언어 설정이 저장되었습니다",
    languagePreferenceSavedDescription: "AI 응답이 이제 {language}로 제공됩니다.",
    errorSavingLanguage: "언어 설정 저장 중 오류 발생",
    errorSavingLanguageDescription: "{error}",
    
    analysisComplete: "분석 완료",
    analysisCompleteDescription: "{count}개의 항목이 감지되었습니다. 추가하기 전에 세부사항을 검토하고 편집하세요.",
    analysisFailed: "분석 실패",
    analysisFailedDescription: "{error}",
    noImagesSelected: "선택된 이미지가 없습니다",
    noImagesSelectedDescription: "최소한 하나의 사진을 선택하거나 촬영하세요.",
    recordingStarted: "녹음 시작",
    recordingStartedDescription: "재고에 추가하고 싶은 항목에 대해 명확하게 말씀해 주세요.",
    recordingStopped: "녹음 중지",
    recordingStoppedDescription: "이제 녹음을 재생하거나 분석할 수 있습니다.",
    recordingFailed: "녹음 실패",
    recordingFailedDescription: "마이크에 접근할 수 없습니다. 권한을 확인하세요.",
    noRecordingFound: "녹음을 찾을 수 없습니다",
    noRecordingFoundDescription: "먼저 음성을 녹음하세요.",
    
    recipesGenerated: "레시피가 생성되었습니다!",
    recipesGeneratedDescription: "재료에 대한 {count}개의 레시피를 찾았습니다.",
    errorGeneratingRecipes: "레시피 생성 중 오류 발생",
    errorGeneratingRecipesDescription: "{error}",
    recipeAddedToMealPlan: "레시피가 식사 계획에 추가되었습니다!",
    recipeAddedToMealPlanDescription: "{recipeName}이 식사 계획에 추가되었습니다.",
    
    error: "오류",
    success: "성공",
    warning: "경고",
    info: "정보",
    dismiss: "거부",
    add: "추가",
    save: "저장",
    cancel: "취소",
    edit: "편집",
    delete: "삭제",
    loading: "로딩 중...",
    retry: "다시 시도",
    
    minutes: "분",
    hours: "시간",
    days: "일",
    
    easy: "쉬움",
    medium: "보통",
    hard: "어려움",
    
    high: "높음",
    medium: "보통",
    low: "낮음",
  },
  
  Arabic: {
    aiModelOverloaded: "نموذج الذكاء الاصطناعي مثقل",
    aiModelOverloadedDescription: "نموذج الذكاء الاصطناعي مثقل حاليًا. يرجى المحاولة مرة أخرى في غضون بضع دقائق.",
    aiRecommendationsError: "خطأ",
    aiRecommendationsErrorDescription: "فشل في توليد توصيات الذكاء الاصطناعي. يرجى المحاولة مرة أخرى لاحقًا.",
    languagePreferenceSaved: "تم حفظ تفضيل اللغة",
    languagePreferenceSavedDescription: "ستكون ردود الذكاء الاصطناعي الآن بـ {language}.",
    errorSavingLanguage: "خطأ في حفظ تفضيل اللغة",
    errorSavingLanguageDescription: "{error}",
    
    analysisComplete: "اكتمل التحليل",
    analysisCompleteDescription: "تم اكتشاف {count} عنصر{plural}. راجع وحرر التفاصيل قبل الإضافة.",
    analysisFailed: "فشل التحليل",
    analysisFailedDescription: "{error}",
    noImagesSelected: "لم يتم اختيار صور",
    noImagesSelectedDescription: "يرجى اختيار أو التقاط صورة واحدة على الأقل.",
    recordingStarted: "بدأ التسجيل",
    recordingStartedDescription: "تحدث بوضوح عن العناصر التي تريد إضافتها إلى مخزونك.",
    recordingStopped: "توقف التسجيل",
    recordingStoppedDescription: "يمكنك الآن تشغيل تسجيلك أو تحليله.",
    recordingFailed: "فشل التسجيل",
    recordingFailedDescription: "لا يمكن الوصول إلى الميكروفون. يرجى التحقق من أذوناتك.",
    noRecordingFound: "لم يتم العثور على تسجيل",
    noRecordingFoundDescription: "يرجى تسجيل صوتك أولاً.",
    
    recipesGenerated: "تم توليد الوصفات!",
    recipesGeneratedDescription: "تم العثور على {count} وصفة لمكوناتك.",
    errorGeneratingRecipes: "خطأ في توليد الوصفات",
    errorGeneratingRecipesDescription: "{error}",
    recipeAddedToMealPlan: "تمت إضافة الوصفة إلى خطة الوجبات!",
    recipeAddedToMealPlanDescription: "تمت إضافة {recipeName} إلى خطط وجباتك.",
    
    error: "خطأ",
    success: "نجح",
    warning: "تحذير",
    info: "معلومات",
    dismiss: "رفض",
    add: "إضافة",
    save: "حفظ",
    cancel: "إلغاء",
    edit: "تحرير",
    delete: "حذف",
    loading: "جاري التحميل...",
    retry: "إعادة المحاولة",
    
    minutes: "دقائق",
    hours: "ساعات",
    days: "أيام",
    
    easy: "سهل",
    medium: "متوسط",
    hard: "صعب",
    
    high: "عالي",
    medium: "متوسط",
    low: "منخفض",
  },
};

export function formatMessage(message: string, params: Record<string, any> = {}): string {
  let formattedMessage = message;
  
  for (const [key, value] of Object.entries(params)) {
    const placeholder = `{${key}}`;
    formattedMessage = formattedMessage.replace(placeholder, String(value));
  }
  
  return formattedMessage;
}

export function getLocalizedMessage(language: SupportedLanguage, key: keyof LocalizedMessages, params: Record<string, any> = {}): string {
  const message = messages[language]?.[key] || messages['English'][key];
  return formatMessage(message, params);
}

export function getPluralSuffix(count: number, language: SupportedLanguage): string {
  if (count === 1) return '';
  
  // Handle different plural rules for different languages
  switch (language) {
    case 'Hebrew':
    case 'Arabic':
      return 'ים';
    case 'Russian':
      return count >= 2 && count <= 4 ? 'а' : 'ов';
    default:
      return 's';
  }
}