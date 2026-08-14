// Structured transcription of docs/06_Curriculum_Dataset.md.
//
// Course names and codes are copied verbatim from that document — do not
// rename, normalize, translate, or "correct" them (docs/10_Claude_Master_Prompt.md
// §6, §26; task instructions §2). This file is seed-source data, not
// application logic, consumed only by prisma/seed.ts.
//
// Category names below use the exact CourseCategory enum values from
// prisma/schema.prisma (docs/05_Curriculum_Data_Model.md §7). Section
// headers in the dataset map to these categories as follows (documented in
// the Phase 4 plan report, not invented here):
//   Common Core (pre-1403)              -> SPECIALIZED_REQUIRED
//   Specialized Required (1403+)        -> SPECIALIZED_REQUIRED
//   Specialized Selective (both eras)   -> SPECIALIZED_ELECTIVE
//   Elective (both eras)                -> ELECTIVE
//   Preparatory (both eras)              -> PREPARATORY
//   Basic (both eras)                    -> BASIC
//   General (both eras)                  -> GENERAL
//   Skills / Employability (1403+)       -> SKILLS_EMPLOYABILITY
//   SE/IT Specialization (pre-1403)      -> ORIENTATION_SPECIALIZED

export const SE_CURRICULUM_NAME = "Computer Engineering — Software Engineering";
export const IT_CURRICULUM_NAME = "Computer Engineering — Information Technology";
export const UNIFIED_CURRICULUM_NAME = "Computer Engineering — Unified";

export interface CourseEntry {
  name: string;
  code: string;
}

export interface CategorySection {
  /// Curriculum names this section's courses belong to.
  curricula: string[];
  category:
    | "GENERAL"
    | "BASIC"
    | "SPECIALIZED_REQUIRED"
    | "SPECIALIZED_ELECTIVE"
    | "ELECTIVE"
    | "PREPARATORY"
    | "SKILLS_EMPLOYABILITY"
    | "ORIENTATION_SPECIALIZED";
  /// Section label as it appears in docs/06_Curriculum_Dataset.md (used for
  /// CourseGroup.name / CurriculumRequirement.name).
  label: string;
  /// Units stated in the dataset section header (docs/06_Curriculum_Dataset.md).
  requiredUnits: number;
  /// SPECIALIZED_ELECTIVE / ELECTIVE sections are represented as a
  /// CourseGroup + a COURSE_GROUP CurriculumRequirement (docs/07_Database_Schema.md
  /// §9-§11); other categories get a CATEGORY_UNITS requirement instead.
  isGroup: boolean;
  /// docs/05_Curriculum_Data_Model.md §9 — 1403+ elective's documented
  /// practical-unit requirement. Only set where the dataset explicitly states it.
  minimumPracticalUnits?: number;
  courses: CourseEntry[];
}

// ---------------------------------------------------------------------------
// Pre-1403 — docs/06_Curriculum_Dataset.md §3
// Shared sections (3.1-3.4, 3.7-3.8) apply to both SE and IT (§3: "the exact
// assignment of each shared section to each orientation" is flagged TBD, but
// the same section is explicitly used to define the composition of both
// curricula — the only concrete assignment the doc provides).
// ---------------------------------------------------------------------------

const SHARED_PRE_1403 = [SE_CURRICULUM_NAME, IT_CURRICULUM_NAME];

const commonCore: CategorySection = {
  curricula: SHARED_PRE_1403,
  category: "SPECIALIZED_REQUIRED",
  label: "Common Core",
  requiredUnits: 59,
  isGroup: false,
  courses: [
    { name: "آز ریز پردازنده", code: "4628102126" },
    { name: "آز مدار منطقی و معماری کامپیوتر", code: "4628181640" },
    { name: "مدار الکتریکی", code: "4628147685" },
    { name: "ریاضیات گسسته", code: "4628129880" },
    { name: "برنامه سازی پیشرفته", code: "4628111667" },
    { name: "سیگنالها و سیستم ها", code: "4628135313" },
    { name: "ریز پردازنده و زبان اسمبلی", code: "4628130341" },
    { name: "شبکه های کامپیوتری", code: "4628135451" },
    { name: "هوش مصنوعی", code: "4628155511" },
    { name: "ساختمان داده", code: "4628132653" },
    { name: "مدار منطقی", code: "4628147873" },
    { name: "نظریه زبان", code: "4628153620" },
    { name: "زبان تخصصی", code: "4628130407" },
    { name: "روش پژوهش و ارائه", code: "4628127605" },
    { name: "ریاضیات مهندسی", code: "4628129896" },
    { name: "معماری کامپیوتر", code: "4628150474" },
    { name: "سیستم های عامل", code: "4628169362" },
    { name: "طراحی الگوریتم", code: "4628137064" },
    { name: "سیستم های دیجیتال", code: "4628164617" },
    { name: "اصول طراحی کامپایلر", code: "4628105622" },
    { name: "آز سیستم عامل", code: "4628102246" },
    { name: "آز شبکه", code: "4628101498" },
    { name: "مبانی کامپیوتر", code: "4628145941" },
  ],
};

const specializedSelectivePre1403: CategorySection = {
  curricula: SHARED_PRE_1403,
  category: "SPECIALIZED_ELECTIVE",
  label: "Specialized Selective",
  requiredUnits: 12,
  isGroup: true,
  courses: [
    { name: "پیاده سازی پایگاه داده", code: "4628181643" },
    { name: "مبانی داده کاوی", code: "4628144915" },
    { name: "مبانی بازیابی اطلاعات و جستجوی وب", code: "4628164509" },
    { name: "سیستم اطلاعات مدیریت", code: "4628171999" },
  ],
};

const electivePre1403: CategorySection = {
  curricula: SHARED_PRE_1403,
  category: "ELECTIVE",
  label: "Elective",
  requiredUnits: 8,
  isGroup: true,
  courses: [
    { name: "سیستم چند رسانه‌ای", code: "4628135053" },
    { name: "آزمایشگاه مهندسی نرم افزار", code: "4628102924" },
    { name: "کارگاه برنامه نویسی متلب", code: "4628182893" },
    { name: "آز مدار الکتریکی", code: "4628102805" },
    { name: "گرافیک کامپیوتری", code: "4628142462" },
    { name: "مباحث ویژه 1", code: "4628143773" },
    { name: "آز پایگاه داده", code: "4628101485" },
  ],
};

const preparatoryPre1403: CategorySection = {
  curricula: SHARED_PRE_1403,
  category: "PREPARATORY",
  label: "Preparatory",
  requiredUnits: 6,
  isGroup: false,
  courses: [
    { name: "ریاضیات پایه", code: "55001" },
    { name: "آمار احتمالات", code: "55005" },
    { name: "زبان پایه", code: "99093" },
  ],
};

const seSpecialization: CategorySection = {
  curricula: [SE_CURRICULUM_NAME],
  category: "ORIENTATION_SPECIALIZED",
  label: "Software Engineering Specialization",
  requiredUnits: 19,
  isGroup: false,
  courses: [
    { name: "تحلیل طراحی", code: "4628117515" },
    { name: "پایگاه داده", code: "4628114001" },
    { name: "طراحی زبان", code: "4628137355" },
    { name: "مهندسی نرم افزار", code: "4628164737" },
    { name: "مهندسی اینترنت", code: "4628151527" },
    { name: "پروژه نرم افزار", code: "4628183688" },
    { name: "کارآموزی", code: "4628156372" },
  ],
};

const itSpecialization: CategorySection = {
  curricula: [IT_CURRICULUM_NAME],
  category: "ORIENTATION_SPECIALIZED",
  label: "Information Technology Specialization",
  requiredUnits: 21,
  isGroup: false,
  courses: [
    { name: "پروژه فناوری اطلاعات", code: "4628114947" },
    { name: "یکپارچه سازی کاربرد های سازمانی", code: "4628162051" },
    { name: "مدیریت پروژه های فناوری اطلاعات", code: "4628148579" },
    { name: "اصول مدیریت و برنامه ریزی راهبرد های فناوری اطلاعات", code: "4628105928" },
    { name: "مبانی رایانش امن", code: "4628144960" },
    { name: "تجارت الکترونیکی", code: "4628116851" },
    { name: "اصول فناوری اطلاعات", code: "4628105776" },
    { name: "اقتصاد مهندسی", code: "4628107113" },
  ],
};

const basicPre1403: CategorySection = {
  curricula: SHARED_PRE_1403,
  category: "BASIC",
  label: "Basic",
  requiredUnits: 20,
  isGroup: false,
  courses: [
    { name: "کارگاه کامپیوتر", code: "4628160442" },
    { name: "آز فیزیک 2", code: "4628102515" },
    { name: "آمار احتمالات مهندسی", code: "4628107851" },
    { name: "ریاضی 1", code: "4628165140" },
    { name: "ریاضی 2", code: "4628129685" },
    { name: "فیزیک 1", code: "4628141460" },
    { name: "فیزیک 2", code: "4628141492" },
    { name: "معادلات دیفرانسیل", code: "4628150360" },
  ],
};

const generalCourses: CourseEntry[] = [
  { name: "تربیت بدنی", code: "99079" },
  { name: "ورزش 1", code: "99062" },
  { name: "دانش خانواده و جمعیت", code: "90128" },
  { name: "زبان فارسی", code: "90029" },
  { name: "تاریخ فرهنگ و تمدن اسلامی", code: "92381" },
  { name: "وصیت نامه امام", code: "99073" },
  { name: "انس با قرآن", code: "99083" },
  { name: "اندیشه 1", code: "90610" },
  { name: "اندیشه 2", code: "98841" },
  { name: "انسان در اسلام", code: "90613" },
  { name: "حقوق اجتماعی و سیاسی", code: "90063" },
  { name: "فلسفه اخلاق", code: "98982" },
  { name: "اخلاق اسلامی", code: "98961" },
  { name: "آیین زندگی", code: "98923" },
  { name: "عرفان عملی اسلامی", code: "98949" },
  { name: "انقلاب اسلامی", code: "90755" },
  { name: "آشنایی با قانون اساسی", code: "90046" },
  { name: "اندیشه سیاسی", code: "90064" },
  { name: "تاریخ تحلیلی صدر اسلام", code: "99041" },
  { name: "تاریخ امامت", code: "90121" },
  { name: "تفسیر موضوعی قرآن", code: "90763" },
  { name: "تفسیر موضوعی نهج البلاغه", code: "90313" },
  { name: "دفاع مقدس", code: "90881" },
  { name: "زبان انگلیسی ترکیبی 1", code: "99090" },
  { name: "زبان انگلیسی ترکیبی 2", code: "99091" },
  { name: "زبان انگلیسی ترکیبی 3", code: "99092" },
];

const generalPre1403: CategorySection = {
  curricula: SHARED_PRE_1403,
  category: "GENERAL",
  label: "General",
  requiredUnits: 26,
  isGroup: false,
  courses: generalCourses,
};

// ---------------------------------------------------------------------------
// 1403+ — docs/06_Curriculum_Dataset.md §4
// ---------------------------------------------------------------------------

const UNIFIED = [UNIFIED_CURRICULUM_NAME];

const specializedRequired1403: CategorySection = {
  curricula: UNIFIED,
  category: "SPECIALIZED_REQUIRED",
  label: "Specialized Required",
  requiredUnits: 59,
  isGroup: false,
  courses: [
    { name: "مبانی کامپیوتر", code: "7000031535" },
    // "کارگاه کامپیوتر" (7000031553) also appears in Basic (§4.3) — a
    // documented, unresolved category conflict (docs/06_Curriculum_Dataset.md
    // §7). Intentionally NOT linked into either category; see seed.ts.
    { name: "کارگاه کامپیوتر", code: "7000031553" },
    { name: "ریاضیات گسسته", code: "7000031536" },
    { name: "مدار منطقی", code: "7000031537" },
    { name: "آز مدار منطقی", code: "7000031554" },
    { name: "برنامه سازی پیشرفته", code: "7000031538" },
    { name: "زبان تخصصی", code: "7000031552" },
    { name: "مدار الکتریکی", code: "7000031539" },
    { name: "آز مدار الکتریکی", code: "7000031555" },
    { name: "داده ساختار و الگوریتم", code: "7000031540" },
    { name: "معماری کامپیوتر", code: "7000031541" },
    { name: "آز معماری", code: "7000031556" },
    { name: "سیستم های دیجیتال", code: "7000031542" },
    { name: "نظریه زبان", code: "7000031543" },
    { name: "جبر خطی", code: "7000031544" },
    { name: "هوش مصنوعی", code: "7000031545" },
    { name: "سیستم نهفته بی درنگ", code: "7000031546" },
    { name: "سیستم های عامل", code: "7000031547" },
    { name: "آز سیستم عامل", code: "7000031557" },
    { name: "روش پژوهش و ارائه", code: "7000031548" },
    { name: "تحلیل طراحی", code: "7000031549" },
    { name: "شبکه های کامپیوتری", code: "7000031550" },
    { name: "آز شبکه", code: "7000031558" },
    { name: "امنیت سیستم", code: "7000031551" },
  ],
};

const specializedSelective1403: CategorySection = {
  curricula: UNIFIED,
  category: "SPECIALIZED_ELECTIVE",
  label: "Specialized Selective",
  requiredUnits: 21,
  isGroup: true,
  courses: [
    { name: "طراحی الگوریتم", code: "7000031559" },
    { name: "سیگنالها و سیستم ها", code: "7000031560" },
    { name: "پایگاه داده", code: "7000031561" },
    { name: "طراحی زبان", code: "7000031562" },
    { name: "بازیابی اطلاعات", code: "7000031563" },
    { name: "رایانش چند هسته‌ای", code: "7000031564" },
    { name: "داده کاوی", code: "7000031565" },
    { name: "محاسبات عددی", code: "7000031566" },
    { name: "مهندسی نرم افزار", code: "7000031567" },
    { name: "طراحی کامپایلرها", code: "7000031568" },
    { name: "شبیه سازی", code: "7000031569" },
    { name: "طراحی مدار", code: "7000031570" },
    // Duplicate code 7000031588, shared with a different-named Elective
    // course below (docs/06_Curriculum_Dataset.md §7(b)) — preserved as-is.
    { name: "مدیریت پروژه", code: "7000031588" },
    { name: "طراحی در سطح سیستم", code: "7000031572" },
  ],
};

const basic1403: CategorySection = {
  curricula: UNIFIED,
  category: "BASIC",
  label: "Basic",
  requiredUnits: 20,
  isGroup: false,
  courses: [
    // Same course/code as in Specialized Required (§4.1) — see note there.
    { name: "کارگاه کامپیوتر", code: "7000031553" },
    { name: "آز فیزیک 2", code: "7000031533" },
    { name: "آمار احتمالات مهندسی", code: "7000031530" },
    { name: "ریاضی 1", code: "7000031527" },
    { name: "ریاضی 2", code: "7000031528" },
    { name: "فیزیک 1", code: "7000031531" },
    { name: "فیزیک 2", code: "7000031532" },
    { name: "معادلات دیفرانسیل", code: "7000031529" },
  ],
};

const elective1403: CategorySection = {
  curricula: UNIFIED,
  category: "ELECTIVE",
  label: "Elective",
  requiredUnits: 10,
  isGroup: true,
  minimumPracticalUnits: 1,
  courses: [
    { name: "گرافیک کامپیوتری", code: "7000031573" },
    { name: "سیستم های چند رسانه‌ای", code: "7000031574" },
    { name: "چابک نرم افزار", code: "7000031575" },
    { name: "آزمون نرم افزار", code: "7000031576" },
    { name: "هوش محاسباتی", code: "7000031577" },
    { name: "مبانی ساخت بازی", code: "7000031578" },
    { name: "انتقال داده", code: "7000031579" },
    { name: "برنامه سازی وب", code: "7000031580" },
    { name: "برنامه سازی موبایل", code: "7000031581" },
    { name: "مبانی رایانش ابری", code: "7000031582" },
    { name: "مبانی اینترنت اشیا", code: "7000031583" },
    { name: "تعامل انسان و کامپیوتر", code: "7000031584" },
    { name: "مدار منطقی پیشرفته", code: "7000031585" },
    { name: "آداب فناوری اطلاعات", code: "7000031586" },
    { name: "تجارت الکترونیکی", code: "7000031587" },
    // Duplicate code 7000031588, shared with "مدیریت پروژه" in Specialized
    // Selective above (docs/06_Curriculum_Dataset.md §7(b)) — preserved as-is.
    { name: "مدیریت و برنامه ریزی راهبردی فناوری اطلاعات", code: "7000031588" },
    { name: "اندازه گیری و کنترل کامپیوتری", code: "7000031589" },
    { name: "زبان های توصیف سخت افزار", code: "7000031590" },
    { name: "نظریه محاسبات", code: "7000031591" },
    { name: "مبانی نظریه بازی", code: "7000031592" },
    { name: "مبانی رمزنگاری", code: "7000031593" },
    { name: "سیستم کنترل خطی", code: "7000031594" },
    { name: "مقدمه رباتیک", code: "7000031595" },
    { name: "مقدمه بیوانفورماتیک", code: "7000031596" },
    { name: "کارآفرینی", code: "7000031597" },
    { name: "آزمایشگاه مهندسی نرم افزار", code: "7000031637" },
    { name: "آز سخت افزار", code: "7000031638" },
    { name: "آزمایشگاه مدارهای مجتمع پرتراکم", code: "7000031639" },
    { name: "آزمایشگاه کنترل کامپیوتری", code: "7000031640" },
    { name: "کارگاه رباتیک", code: "7000031641" },
    { name: "کارگاه ساخت بازی", code: "7000031642" },
    // Duplicate code 7000031598, two different course names
    // (docs/06_Curriculum_Dataset.md §7(a)) — preserved as-is.
    { name: "مفاهیم پیشرفته", code: "7000031598" },
    { name: "مفاهیم پیشرفته 2", code: "7000031598" },
  ],
};

const preparatory1403: CategorySection = {
  curricula: UNIFIED,
  category: "PREPARATORY",
  label: "Preparatory",
  requiredUnits: 6,
  isGroup: false,
  courses: [
    { name: "ریاضیات پایه", code: "55001" },
    { name: "آمار احتمالات", code: "55005" },
    { name: "زبان پایه", code: "99093" },
  ],
};

const skillsEmployability1403: CategorySection = {
  curricula: UNIFIED,
  category: "SKILLS_EMPLOYABILITY",
  label: "Skills / Employability",
  requiredUnits: 5,
  isGroup: false,
  courses: [
    { name: "آشنایی با صنعت", code: "7000035094" },
    { name: "مهارت نرم", code: "7000035095" },
    { name: "کارآموزی", code: "7000035096" },
  ],
};

const general1403: CategorySection = {
  curricula: UNIFIED,
  category: "GENERAL",
  label: "General",
  requiredUnits: 26,
  isGroup: false,
  courses: generalCourses,
};

export const CATEGORY_SECTIONS: CategorySection[] = [
  commonCore,
  specializedSelectivePre1403,
  electivePre1403,
  preparatoryPre1403,
  seSpecialization,
  itSpecialization,
  basicPre1403,
  generalPre1403,
  specializedRequired1403,
  specializedSelective1403,
  basic1403,
  elective1403,
  preparatory1403,
  skillsEmployability1403,
  general1403,
];

// docs/06_Curriculum_Dataset.md §7 — the course whose category assignment is
// an unresolved, documented conflict. Its Course row is seeded, but no
// CurriculumCourse membership is created for it (see prisma/seed.ts).
export const CATEGORY_CONFLICT_COURSE_CODE = "7000031553";
