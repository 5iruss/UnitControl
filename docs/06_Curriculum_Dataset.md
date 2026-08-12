# UnitControl — Curriculum Dataset

**Version:** 1.0  
**Status:** Initial Dataset  
**Source:** User-provided curriculum data

---

## 1. Purpose

This document contains the actual curriculum data used by UnitControl.

It includes:

- Curriculum versions
- Course names
- Course codes
- Course categories
- Required units
- Elective requirements

This document is the source of truth for actual academic data.

Academic data structure is defined in:

`05_Curriculum_Data_Model.md`

Academic validation rules are defined in:

`04_Academic_Rules_Engine.md`

Database implementation is defined in:

`07_Database_Schema.md`

---

# 2. Curriculum Versions

UnitControl currently supports three distinct curricula. The **major** is Computer Engineering in all three; they differ by **entry year** and **orientation**.

| Curriculum | Major | Entry Year | Orientation |
|---|---|---:|---|
| Computer Engineering — Software Engineering | Computer Engineering | 1402 and before | Software Engineering |
| Computer Engineering — Information Technology | Computer Engineering | 1402 and before | Information Technology |
| Computer Engineering — Unified | Computer Engineering | 1403 and after | Unified |

Software Engineering and Information Technology are orientations, not separate majors (see `01_Product_Overview.md` §5 and `04_Academic_Rules_Engine.md` §15).

---

# 3. Pre-1403 Curriculum

The pre-1403 data below defines **two** curricula that share most sections:

- **Software Engineering** orientation: the shared sections (3.1 Common Core, 3.2 Specialized Selective, 3.3 Elective, 3.4 Preparatory, 3.7 Basic, 3.8 General) **plus** the Software Engineering Specialization (3.5).
- **Information Technology** orientation: the same shared sections **plus** the Information Technology Specialization (3.6).

Sections 3.5 and 3.6 are orientation-specific and belong to their respective curriculum only. The exact assignment of each shared section to each orientation:

```text
TBD — Requires official academic verification
```

Course-level unit values and `total_required_units` per curriculum are not supplied (see §7, §9).

## 3.1 Common Core — 59 Units

| Course | Code |
|---|---|
| آز ریز پردازنده | `4628102126` |
| آز مدار منطقی و معماری کامپیوتر | `4628181640` |
| مدار الکتریکی | `4628147685` |
| ریاضیات گسسته | `4628129880` |
| برنامه سازی پیشرفته | `4628111667` |
| سیگنالها و سیستم ها | `4628135313` |
| ریز پردازنده و زبان اسمبلی | `4628130341` |
| شبکه های کامپیوتری | `4628135451` |
| هوش مصنوعی | `4628155511` |
| ساختمان داده | `4628132653` |
| مدار منطقی | `4628147873` |
| نظریه زبان | `4628153620` |
| زبان تخصصی | `4628130407` |
| روش پژوهش و ارائه | `4628127605` |
| ریاضیات مهندسی | `4628129896` |
| معماری کامپیوتر | `4628150474` |
| سیستم های عامل | `4628169362` |
| طراحی الگوریتم | `4628137064` |
| سیستم های دیجیتال | `4628164617` |
| اصول طراحی کامپایلر | `4628105622` |
| آز سیستم عامل | `4628102246` |
| آز شبکه | `4628101498` |
| مبانی کامپیوتر | `4628145941` |

---

## 3.2 Specialized Selective — 12 Units

| Course | Code |
|---|---|
| پیاده سازی پایگاه داده | `4628181643` |
| مبانی داده کاوی | `4628144915` |
| مبانی بازیابی اطلاعات و جستجوی وب | `4628164509` |
| سیستم اطلاعات مدیریت | `4628171999` |

---

## 3.3 Elective — 8 Units

| Course | Code |
|---|---|
| سیستم چند رسانه‌ای | `4628135053` |
| آزمایشگاه مهندسی نرم افزار | `4628102924` |
| کارگاه برنامه نویسی متلب | `4628182893` |
| آز مدار الکتریکی | `4628102805` |
| گرافیک کامپیوتری | `4628142462` |
| مباحث ویژه 1 | `4628143773` |
| آز پایگاه داده | `4628101485` |

---

## 3.4 Preparatory — 6 Units

| Course | Code |
|---|---|
| ریاضیات پایه | `55001` |
| آمار احتمالات | `55005` |
| زبان پایه | `99093` |

---

## 3.5 Software Engineering Specialization — 19 Units

| Course | Code |
|---|---|
| تحلیل طراحی | `4628117515` |
| پایگاه داده | `4628114001` |
| طراحی زبان | `4628137355` |
| مهندسی نرم افزار | `4628164737` |
| مهندسی اینترنت | `4628151527` |
| پروژه نرم افزار | `4628183688` |
| کارآموزی | `4628156372` |

---

## 3.6 Information Technology Specialization — 21 Units

| Course | Code |
|---|---|
| پروژه فناوری اطلاعات | `4628114947` |
| یکپارچه سازی کاربرد های سازمانی | `4628162051` |
| مدیریت پروژه های فناوری اطلاعات | `4628148579` |
| اصول مدیریت و برنامه ریزی راهبرد های فناوری اطلاعات | `4628105928` |
| مبانی رایانش امن | `4628144960` |
| تجارت الکترونیکی | `4628116851` |
| اصول فناوری اطلاعات | `4628105776` |
| اقتصاد مهندسی | `4628107113` |

---

## 3.7 Basic — 20 Units

| Course | Code |
|---|---|
| کارگاه کامپیوتر | `4628160442` |
| آز فیزیک 2 | `4628102515` |
| آمار احتمالات مهندسی | `4628107851` |
| ریاضی 1 | `4628165140` |
| ریاضی 2 | `4628129685` |
| فیزیک 1 | `4628141460` |
| فیزیک 2 | `4628141492` |
| معادلات دیفرانسیل | `4628150360` |

---

## 3.8 General — 26 Units

| Course | Code |
|---|---|
| تربیت بدنی | `99079` |
| ورزش 1 | `99062` |
| دانش خانواده و جمعیت | `90128` |
| زبان فارسی | `90029` |
| تاریخ فرهنگ و تمدن اسلامی | `92381` |
| وصیت نامه امام | `99073` |
| انس با قرآن | `99083` |
| اندیشه 1 | `90610` |
| اندیشه 2 | `98841` |
| انسان در اسلام | `90613` |
| حقوق اجتماعی و سیاسی | `90063` |
| فلسفه اخلاق | `98982` |
| اخلاق اسلامی | `98961` |
| آیین زندگی | `98923` |
| عرفان عملی اسلامی | `98949` |
| انقلاب اسلامی | `90755` |
| آشنایی با قانون اساسی | `90046` |
| اندیشه سیاسی | `90064` |
| تاریخ تحلیلی صدر اسلام | `99041` |
| تاریخ امامت | `90121` |
| تفسیر موضوعی قرآن | `90763` |
| تفسیر موضوعی نهج البلاغه | `90313` |
| دفاع مقدس | `90881` |
| زبان انگلیسی ترکیبی 1 | `99090` |
| زبان انگلیسی ترکیبی 2 | `99091` |
| زبان انگلیسی ترکیبی 3 | `99092` |

---

# 4. 1403+ Computer Engineering Curriculum

## 4.1 Specialized Required — 59 Units

| Course | Code |
|---|---|
| مبانی کامپیوتر | `7000031535` |
| کارگاه کامپیوتر | `7000031553` |
| ریاضیات گسسته | `7000031536` |
| مدار منطقی | `7000031537` |
| آز مدار منطقی | `7000031554` |
| برنامه سازی پیشرفته | `7000031538` |
| زبان تخصصی | `7000031552` |
| مدار الکتریکی | `7000031539` |
| آز مدار الکتریکی | `7000031555` |
| داده ساختار و الگوریتم | `7000031540` |
| معماری کامپیوتر | `7000031541` |
| آز معماری | `7000031556` |
| سیستم های دیجیتال | `7000031542` |
| نظریه زبان | `7000031543` |
| جبر خطی | `7000031544` |
| هوش مصنوعی | `7000031545` |
| سیستم نهفته بی درنگ | `7000031546` |
| سیستم های عامل | `7000031547` |
| آز سیستم عامل | `7000031557` |
| روش پژوهش و ارائه | `7000031548` |
| تحلیل طراحی | `7000031549` |
| شبکه های کامپیوتری | `7000031550` |
| آز شبکه | `7000031558` |
| امنیت سیستم | `7000031551` |

---

## 4.2 Specialized Selective — 21 Units

| Course | Code |
|---|---|
| طراحی الگوریتم | `7000031559` |
| سیگنالها و سیستم ها | `7000031560` |
| پایگاه داده | `7000031561` |
| طراحی زبان | `7000031562` |
| بازیابی اطلاعات | `7000031563` |
| رایانش چند هسته‌ای | `7000031564` |
| داده کاوی | `7000031565` |
| محاسبات عددی | `7000031566` |
| مهندسی نرم افزار | `7000031567` |
| طراحی کامپایلرها | `7000031568` |
| شبیه سازی | `7000031569` |
| طراحی مدار | `7000031570` |
| مدیریت پروژه | `7000031588` |
| طراحی در سطح سیستم | `7000031572` |

---

## 4.3 Basic — 20 Units

| Course | Code |
|---|---|
| کارگاه کامپیوتر | `7000031553` |
| آز فیزیک 2 | `7000031533` |
| آمار احتمالات مهندسی | `7000031530` |
| ریاضی 1 | `7000031527` |
| ریاضی 2 | `7000031528` |
| فیزیک 1 | `7000031531` |
| فیزیک 2 | `7000031532` |
| معادلات دیفرانسیل | `7000031529` |

---

## 4.4 Elective — 10 Units

Requirement:

> At least 1 practical unit from a workshop or laboratory course.

| Course | Code |
|---|---|
| گرافیک کامپیوتری | `7000031573` |
| سیستم های چند رسانه‌ای | `7000031574` |
| چابک نرم افزار | `7000031575` |
| آزمون نرم افزار | `7000031576` |
| هوش محاسباتی | `7000031577` |
| مبانی ساخت بازی | `7000031578` |
| انتقال داده | `7000031579` |
| برنامه سازی وب | `7000031580` |
| برنامه سازی موبایل | `7000031581` |
| مبانی رایانش ابری | `7000031582` |
| مبانی اینترنت اشیا | `7000031583` |
| تعامل انسان و کامپیوتر | `7000031584` |
| مدار منطقی پیشرفته | `7000031585` |
| آداب فناوری اطلاعات | `7000031586` |
| تجارت الکترونیکی | `7000031587` |
| مدیریت و برنامه ریزی راهبردی فناوری اطلاعات | `7000031588` |
| اندازه گیری و کنترل کامپیوتری | `7000031589` |
| زبان های توصیف سخت افزار | `7000031590` |
| نظریه محاسبات | `7000031591` |
| مبانی نظریه بازی | `7000031592` |
| مبانی رمزنگاری | `7000031593` |
| سیستم کنترل خطی | `7000031594` |
| مقدمه رباتیک | `7000031595` |
| مقدمه بیوانفورماتیک | `7000031596` |
| کارآفرینی | `7000031597` |
| آزمایشگاه مهندسی نرم افزار | `7000031637` |
| آز سخت افزار | `7000031638` |
| آزمایشگاه مدارهای مجتمع پرتراکم | `7000031639` |
| آزمایشگاه کنترل کامپیوتری | `7000031640` |
| کارگاه رباتیک | `7000031641` |
| کارگاه ساخت بازی | `7000031642` |
| مفاهیم پیشرفته | `7000031598` |
| مفاهیم پیشرفته 2 | `7000031598` |

---

## 4.5 Preparatory — 6 Units

| Course | Code |
|---|---|
| ریاضیات پایه | `55001` |
| آمار احتمالات | `55005` |
| زبان پایه | `99093` |

---

## 4.6 Skills / Employability — 5 Units

| Course | Code |
|---|---|
| آشنایی با صنعت | `7000035094` |
| مهارت نرم | `7000035095` |
| کارآموزی | `7000035096` |

---

## 4.7 General — 26 Units

| Course | Code |
|---|---|
| تربیت بدنی | `99079` |
| ورزش 1 | `99062` |
| دانش خانواده و جمعیت | `90128` |
| زبان فارسی | `90029` |
| تاریخ فرهنگ و تمدن اسلامی | `92381` |
| وصیت نامه امام | `99073` |
| انس با قرآن | `99083` |
| اندیشه 1 | `90610` |
| اندیشه 2 | `98841` |
| انسان در اسلام | `90613` |
| حقوق اجتماعی و سیاسی | `90063` |
| فلسفه اخلاق | `98982` |
| اخلاق اسلامی | `98961` |
| آیین زندگی | `98923` |
| عرفان عملی اسلامی | `98949` |
| انقلاب اسلامی | `90755` |
| آشنایی با قانون اساسی | `90046` |
| اندیشه سیاسی | `90064` |
| تاریخ تحلیلی صدر اسلام | `99041` |
| تاریخ امامت | `90121` |
| تفسیر موضوعی قرآن | `90763` |
| تفسیر موضوعی نهج البلاغه | `90313` |
| دفاع مقدس | `90881` |
| زبان انگلیسی ترکیبی 1 | `99090` |
| زبان انگلیسی ترکیبی 2 | `99091` |
| زبان انگلیسی ترکیبی 3 | `99092` |

---

# 5. Course Relationships

Prerequisite and corequisite relationships are intentionally **not populated in this initial dataset**.

They must be added only after verification.

Source of truth:

`04_Academic_Rules_Engine.md` — relationship behavior

`06_Curriculum_Dataset.md` — actual verified relationships

No relationship should be inferred from course names or assumed from common academic practice.

---

# 6. Academic Term Codes

UnitControl uses the following academic term format:

| Code | Meaning |
|---|---|
| `4051` | Mehr 1405 |
| `4052` | Bahman 1405 |
| `4053` | Summer 1405 |

General format:

```text
YYYS
````

Where:

* `YYY` identifies the academic year.
* `S` identifies the semester.

Semester values:

```text
1 = Mehr
2 = Bahman
3 = Summer
```

---

# 7. Dataset Integrity Notes

The following values were supplied directly and should **not be silently changed**.

### Duplicate Course Codes

**(a)** The 1403+ elective list contains two different courses sharing one code:

```text
مفاهیم پیشرفته   → 7000031598
مفاهیم پیشرفته 2 → 7000031598
```

**(b)** In the 1403+ dataset, the same code is used for two different courses across two categories:

```text
مدیریت پروژه (Specialized Selective §4.2)                          → 7000031588
مدیریت و برنامه ریزی راهبردی فناوری اطلاعات (Elective §4.4)          → 7000031588
```

Note also that the code `7000031571` does not appear anywhere in the dataset, so the intended code for one of the two courses above cannot be inferred.

Both duplicate-code cases:

```text
TBD — Requires official academic verification
```

The correct codes must not be guessed. The supplied values are preserved as-is.

### Category Duplication

The 1403+ dataset lists:

```text
کارگاه کامپیوتر → 7000031553
```

under both:

* Specialized Required
* Basic

```text
TBD — Requires official academic verification
```

### Unit Values

Course-level unit values were not supplied in the provided dataset.

They must be verified before the dataset is considered complete for production.

---

# 8. External References

The following sources were provided for curriculum/course-code verification:

* `https://iaucourseexp.github.io/CoursesCodes/`
* `https://iaucs.github.io/chart/`

These sources may be used to verify or expand the dataset.

Information should not be silently changed based on external sources. Any externally verified correction should be explicitly documented.

---

# 9. Dataset Status

Current status:

```text
Curriculum definitions      ✓
Course names                ✓
Course codes                ✓
Course categories           ✓
Major curriculum versions   ✓
Elective requirements       ✓
Academic term format        ✓

Course credit values        ⚠ Requires verification
Prerequisites               ⚠ Requires verification
Corequisites                ⚠ Requires verification
Practical classification    ⚠ Requires verification
Final academic requirements ⚠ Requires verification
```

Until these items are verified, they must not be treated as authoritative production data.

---

# 10. References

This dataset follows the structure defined in:

`05_Curriculum_Data_Model.md`

Academic behavior is defined in:

`04_Academic_Rules_Engine.md`

Database implementation is defined in:

`07_Database_Schema.md`

Technical implementation is defined in:

`09_Technical_Requirements.md`

The final implementation instructions are defined in:

`10_Claude_Master_Prompt.md`
