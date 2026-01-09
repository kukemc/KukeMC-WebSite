'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, ArrowLeft, Send, CheckCircle2, Upload, X, FileText, ChevronDown, Star, ChevronRight, ChevronLeft } from 'lucide-react';
import api, { generateUploadHeaders } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import clsx from 'clsx';

interface Question {
  id: string;
  type: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string; score?: number }[];
  description?: string;
  other_option?: boolean;
  other_label?: string;
}

interface Page {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

interface LogicRule {
  trigger: {
    questionId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: string;
  };
  action: {
    type: 'show' | 'hide' | 'jump_to_page' | 'end_form';
    targetId: string; // questionId or pageId
  };
}

interface FormSchema {
  pages: Page[];
  logic: LogicRule[];
}

interface FormDetail {
  id: number;
  title: string;
  description: string;
  status: string;
  require_login: boolean;
  schema: FormSchema | Question[] | string;
  start_time?: string;
  end_time?: string;
  cover_image?: string;
}

const FormDetailClient = ({ id }: { id: string | number }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [form, setForm] = useState<FormDetail | null>(null);
  const [parsedSchema, setParsedSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [otherAnswers, setOtherAnswers] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  // Helper to normalize schema
  const normalizeSchema = (schema: any): FormSchema => {
     if (typeof schema === 'string') {
        try { schema = JSON.parse(schema); } catch { schema = []; }
     }
     
     if (Array.isArray(schema)) {
        // V1 Schema -> Convert to V2
        return {
           pages: [{
              id: 'default',
              title: '',
              description: '',
              questions: schema
           }],
           logic: []
        };
     }
     
     // V2 Schema
     if (!schema.pages) schema.pages = [];
     if (!schema.logic) schema.logic = [];
     return schema as FormSchema;
  };

  useEffect(() => {
    api.get<FormDetail>(`/api/forms/${id}`)
      .then(res => {
        const formData = res.data;
        setForm(formData);
        setParsedSchema(normalizeSchema(formData.schema));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.status === 401 ? '需要登录才能查看' : '无法加载问卷或问卷不存在');
        setLoading(false);
      });
  }, [id]);

  const handleFileUpload = async (questionId: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast('文件大小不能超过 10MB', 'error');
      return;
    }

    setUploading(prev => ({ ...prev, [questionId]: true }));
    try {
      const headers = await generateUploadHeaders();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'form_submission');
      formData.append('parent_id', form ? String(form.id) : 'default');

      const res = await api.post('/api/upload/image', formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      });

      handleInputChange(questionId, res.data.url);
      showToast('文件上传成功', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.detail || '文件上传失败', 'error');
    } finally {
      setUploading(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleInputChange = (qId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  // Logic Engine
  const checkCondition = (trigger: LogicRule['trigger']) => {
     const val = answers[trigger.questionId];
     if (val === undefined || val === null) return false;
     
     const triggerVal = trigger.value;
     
     switch (trigger.operator) {
        case 'equals': return String(val) == triggerVal;
        case 'not_equals': return String(val) != triggerVal;
        case 'contains': return String(val).includes(triggerVal);
        case 'greater_than': return Number(val) > Number(triggerVal);
        case 'less_than': return Number(val) < Number(triggerVal);
        default: return false;
     }
  };

  const isQuestionVisible = (questionId: string) => {
     if (!parsedSchema) return true;
     
     // Find rules targeting this question for visibility
     const relevantRules = parsedSchema.logic.filter(r => 
        ['show', 'hide'].includes(r.action.type) && r.action.targetId === questionId
     );

     if (relevantRules.length === 0) return true; // Default visible

     // If there are "show" rules, default to hidden unless one matches
     const hasShowRules = relevantRules.some(r => r.action.type === 'show');
     if (hasShowRules) {
        // If any "show" rule matches, it's visible
        return relevantRules.filter(r => r.action.type === 'show').some(r => checkCondition(r.trigger));
     }

     // If only "hide" rules exist
     const shouldHide = relevantRules.filter(r => r.action.type === 'hide').some(r => checkCondition(r.trigger));
     return !shouldHide;
  };

  const currentPage = useMemo(() => {
     if (!parsedSchema || !parsedSchema.pages[currentPageIndex]) return null;
     return parsedSchema.pages[currentPageIndex];
  }, [parsedSchema, currentPageIndex]);

  const visibleQuestions = useMemo(() => {
     if (!currentPage) return [];
     return currentPage.questions.filter(q => isQuestionVisible(q.id));
  }, [currentPage, answers]); // Re-calc when answers change

  // Navigation
  const validateCurrentPage = () => {
     if (!currentPage) return true;
     
     for (const q of visibleQuestions) {
        if (q.type === 'section') continue;
        
        // Other option validation
        if (q.other_option) {
            const val = answers[q.id];
            if (q.type === 'radio' && val === '__other__') {
               if (!otherAnswers[q.id]?.trim() && q.required) {
                  showToast(`请填写${q.other_label || '其他'}内容: ${q.label}`, 'error');
                  return false;
               }
            }
             if (q.type === 'checkbox' && Array.isArray(val) && val.includes('__other__')) {
               if (!otherAnswers[q.id]?.trim() && q.required) {
                  showToast(`请填写${q.other_label || '其他'}内容: ${q.label}`, 'error');
                  return false;
               }
            }
        }

        if (q.required) {
           const val = answers[q.id];
           if (val === undefined || val === null || val === '') {
              showToast(`请填写: ${q.label}`, 'error');
              return false;
           }
           if (Array.isArray(val) && val.length === 0) {
              showToast(`请填写: ${q.label}`, 'error');
              return false;
           }
        }
     }
     return true;
  };

  const handleNext = () => {
     if (!validateCurrentPage()) return;
     if (!parsedSchema) return;

     // Check Logic for Page Jump or End Form
     let nextAction: 'next' | 'jump' | 'end' = 'next';
     let targetId = '';

     // Iterate rules to find page/end logic
     // Priority: Last matching rule wins? Or first? Let's say First for simplicity or check all
     // We check rules triggered by questions on THIS page (or global? usually current page answers trigger it)
     // Actually we just check all rules.
     
     const navigationRules = parsedSchema.logic.filter(r => 
        ['jump_to_page', 'end_form'].includes(r.action.type)
     );

     for (const rule of navigationRules) {
        if (checkCondition(rule.trigger)) {
           if (rule.action.type === 'end_form') {
              nextAction = 'end';
              break; // End takes priority?
           } else if (rule.action.type === 'jump_to_page') {
              nextAction = 'jump';
              targetId = rule.action.targetId;
              break; // First match wins
           }
        }
     }

     if (nextAction === 'end') {
        handleSubmit();
        return;
     }

     if (nextAction === 'jump') {
        const targetIndex = parsedSchema.pages.findIndex(p => p.id === targetId);
        if (targetIndex !== -1) {
           setCurrentPageIndex(targetIndex);
           window.scrollTo(0, 0);
           return;
        }
     }

     // Default Next
     if (currentPageIndex < parsedSchema.pages.length - 1) {
        setCurrentPageIndex(prev => prev + 1);
        window.scrollTo(0, 0);
     } else {
        handleSubmit();
     }
  };

  const handlePrev = () => {
     if (currentPageIndex > 0) {
        setCurrentPageIndex(prev => prev - 1);
        window.scrollTo(0, 0);
     }
  };

  const handleSubmit = async () => {
    if (!form) return;

    // Time checks
    const now = new Date();
    if (form.start_time && new Date(form.start_time) > now) {
        showToast('问卷尚未开始', 'error');
        return;
    }
    if (form.end_time && new Date(form.end_time) < now) {
        showToast('问卷已结束', 'error');
        return;
    }

    if (form.require_login && !user) {
      showToast('请先登录', 'error');
      router.push('/login?redirect=/forms/' + id);
      return;
    }

    // Process Answers (Merge "Other")
    const finalAnswers = { ...answers };
    // Filter out hidden questions? Maybe better to keep all data.
    // But for "Other", we need to merge.
    
    // We iterate ALL questions in schema to merge 'other' fields properly
    // Flatten all questions
    const allQuestions: Question[] = [];
    parsedSchema?.pages.forEach(p => allQuestions.push(...p.questions));

    for (const q of allQuestions) {
       if (q.other_option) {
          if (q.type === 'radio' && finalAnswers[q.id] === '__other__') {
             finalAnswers[q.id] = otherAnswers[q.id]?.trim() || '';
          } else if (q.type === 'checkbox' && Array.isArray(finalAnswers[q.id]) && finalAnswers[q.id].includes('__other__')) {
             finalAnswers[q.id] = finalAnswers[q.id].map((v: string) => v === '__other__' ? (otherAnswers[q.id]?.trim() || '') : v);
          }
       }
    }

    setSubmitting(true);
    try {
      await api.post(`/api/forms/${id}/submit`, { data: finalAnswers });
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.detail || '提交失败，请重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Render helpers
  const isLastPage = parsedSchema ? currentPageIndex === parsedSchema.pages.length - 1 : true;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" size={40} /></div>;
  if (error) return (
      <div className="min-h-screen flex items-center justify-center px-4">
         <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{error}</h3>
            <button onClick={() => router.push('/')} className="text-primary-600 hover:underline">返回首页</button>
         </div>
      </div>
  );
  if (submitted) return (
      <div className="min-h-screen flex items-center justify-center px-4">
         <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">提交成功</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">感谢您的参与！</p>
            <button onClick={() => router.push('/')} className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors">返回首页</button>
         </div>
      </div>
  );

  return (
    <div className="min-h-screen relative transition-colors">
       {/* Background */}
       {form?.cover_image && (
        <div className="absolute top-0 left-0 w-full h-[300px] lg:h-[400px] z-0">
          <img src={form.cover_image} alt="Cover" className="w-full h-full object-cover opacity-100 mask-image-b" />
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-12 lg:py-20 max-w-3xl">
         {/* Form Header */}
         <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-white/10 overflow-hidden mb-8">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800">
               <div className="flex flex-wrap gap-2 mb-4">
                  <span className={clsx("px-2.5 py-1 rounded-md text-xs font-bold uppercase", form?.status === 'published' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-600")}>
                     {form?.status === 'published' ? '进行中' : '已结束'}
                  </span>
               </div>
               <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{form?.title}</h1>
               <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{form?.description}</p>
            </div>
         </div>

         {/* Current Page Content */}
         <AnimatePresence mode="wait">
            <motion.div
               key={currentPage?.id || 'empty'}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.3 }}
               className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden p-8"
            >
               {currentPage?.title && (
                  <div className="mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentPage.title}</h2>
                     {currentPage.description && <p className="text-gray-500 mt-2">{currentPage.description}</p>}
                  </div>
               )}

               <div className="space-y-8">
                  {visibleQuestions.map((q, idx) => (
                     <div key={q.id} className="group">
                        {q.type === 'section' ? (
                           <div className="pt-4 pb-2">
                              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 border-l-4 border-emerald-500 pl-3">{q.label}</h3>
                              {q.description && <p className="text-gray-500 dark:text-gray-400 mt-2 pl-4 text-sm">{q.description}</p>}
                           </div>
                        ) : (
                           <>
                              <label className="block text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                                 {q.label}
                                 {q.required && <span className="text-red-500 ml-1">*</span>}
                              </label>

                              {/* Input Render Logic */}
                              <div className="relative">
                                 {/* TEXT */}
                                 {q.type === 'text' && (
                                    <input 
                                       type="text"
                                       className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                       placeholder={q.placeholder}
                                       value={answers[q.id] || ''}
                                       onChange={e => handleInputChange(q.id, e.target.value)}
                                    />
                                 )}
                                 
                                 {/* TEXTAREA */}
                                 {q.type === 'textarea' && (
                                    <textarea 
                                       rows={4}
                                       className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-y"
                                       placeholder={q.placeholder}
                                       value={answers[q.id] || ''}
                                       onChange={e => handleInputChange(q.id, e.target.value)}
                                    />
                                 )}

                                 {/* NUMBER */}
                                 {q.type === 'number' && (
                                    <input 
                                       type="number"
                                       className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                       placeholder={q.placeholder}
                                       value={answers[q.id] || ''}
                                       onChange={e => handleInputChange(q.id, e.target.value)}
                                    />
                                 )}

                                 {/* EMAIL */}
                                 {q.type === 'email' && (
                                    <input 
                                       type="email"
                                       className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                       placeholder={q.placeholder}
                                       value={answers[q.id] || ''}
                                       onChange={e => handleInputChange(q.id, e.target.value)}
                                    />
                                 )}

                                 {/* RADIO */}
                                 {q.type === 'radio' && (
                                    <div className="space-y-3">
                                       {q.options?.map((opt, i) => (
                                          <label key={i} className={clsx(
                                             "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                                             answers[q.id] === opt.value
                                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                          )}>
                                             <div className="relative flex items-center justify-center">
                                                <input 
                                                   type="radio" 
                                                   name={q.id}
                                                   value={opt.value}
                                                   checked={answers[q.id] === opt.value}
                                                   onChange={e => handleInputChange(q.id, e.target.value)}
                                                   className="peer appearance-none w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 checked:border-emerald-500"
                                                />
                                                <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 scale-0 peer-checked:scale-100 transition-transform"></div>
                                             </div>
                                             <span className="text-gray-700 dark:text-gray-300">{opt.label}</span>
                                          </label>
                                       ))}
                                       {q.other_option && (
                                           <label className={clsx(
                                             "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                                             answers[q.id] === '__other__'
                                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                          )}>
                                             <div className="relative flex items-center justify-center">
                                                <input 
                                                   type="radio" 
                                                   name={q.id}
                                                   value="__other__"
                                                   checked={answers[q.id] === '__other__'}
                                                   onChange={e => handleInputChange(q.id, e.target.value)}
                                                   className="peer appearance-none w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 checked:border-emerald-500"
                                                />
                                                <div className="absolute w-2.5 h-2.5 rounded-full bg-emerald-500 scale-0 peer-checked:scale-100 transition-transform"></div>
                                             </div>
                                             <div className="flex-1">
                                                 <span className="text-gray-700 dark:text-gray-300 mr-2">{q.other_label || '其他'}</span>
                                                 {answers[q.id] === '__other__' && (
                                                     <input 
                                                        type="text"
                                                        onClick={e => e.stopPropagation()}
                                                        value={otherAnswers[q.id] || ''}
                                                        onChange={e => setOtherAnswers(prev => ({...prev, [q.id]: e.target.value}))}
                                                        className="border-b border-gray-300 dark:border-gray-600 bg-transparent outline-none px-1 text-sm w-full mt-1 focus:border-emerald-500"
                                                        placeholder="请输入..."
                                                        autoFocus
                                                     />
                                                 )}
                                             </div>
                                          </label>
                                       )}
                                    </div>
                                 )}

                                 {/* CHECKBOX */}
                                 {q.type === 'checkbox' && (
                                    <div className="space-y-3">
                                       {q.options?.map((opt, i) => {
                                          const isChecked = (answers[q.id] || []).includes(opt.value);
                                          return (
                                             <label key={i} className={clsx(
                                                "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                                                isChecked
                                                   ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                                   : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                             )}>
                                                <div className="relative flex items-center justify-center">
                                                   <input 
                                                      type="checkbox" 
                                                      value={opt.value}
                                                      checked={isChecked}
                                                      onChange={e => {
                                                         const current = answers[q.id] || [];
                                                         const newValue = e.target.checked 
                                                            ? [...current, opt.value]
                                                            : current.filter((v:string) => v !== opt.value);
                                                         handleInputChange(q.id, newValue);
                                                      }}
                                                      className="peer appearance-none w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 checked:bg-emerald-500 checked:border-emerald-500"
                                                   />
                                                   <CheckCircle2 className="absolute w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform" />
                                                </div>
                                                <span className="text-gray-700 dark:text-gray-300">{opt.label}</span>
                                             </label>
                                          );
                                       })}
                                       {q.other_option && (
                                          <label className={clsx(
                                             "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                                             (answers[q.id] || []).includes('__other__')
                                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                          )}>
                                             <div className="relative flex items-center justify-center">
                                                <input 
                                                   type="checkbox" 
                                                   value="__other__"
                                                   checked={(answers[q.id] || []).includes('__other__')}
                                                   onChange={e => {
                                                      const current = answers[q.id] || [];
                                                      const newValue = e.target.checked 
                                                         ? [...current, '__other__']
                                                         : current.filter((v:string) => v !== '__other__');
                                                      handleInputChange(q.id, newValue);
                                                   }}
                                                   className="peer appearance-none w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 checked:bg-emerald-500 checked:border-emerald-500"
                                                />
                                                <CheckCircle2 className="absolute w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform" />
                                             </div>
                                             <div className="flex-1">
                                                 <span className="text-gray-700 dark:text-gray-300 mr-2">{q.other_label || '其他'}</span>
                                                 {(answers[q.id] || []).includes('__other__') && (
                                                     <input 
                                                        type="text"
                                                        onClick={e => e.stopPropagation()}
                                                        value={otherAnswers[q.id] || ''}
                                                        onChange={e => setOtherAnswers(prev => ({...prev, [q.id]: e.target.value}))}
                                                        className="border-b border-gray-300 dark:border-gray-600 bg-transparent outline-none px-1 text-sm w-full mt-1 focus:border-emerald-500"
                                                        placeholder="请输入..."
                                                        autoFocus
                                                     />
                                                 )}
                                             </div>
                                          </label>
                                       )}
                                    </div>
                                 )}
                                 
                                 {/* SWITCH */}
                                 {q.type === 'switch' && (
                                    <button
                                       onClick={() => handleInputChange(q.id, !answers[q.id])}
                                       className={clsx(
                                          "w-14 h-8 rounded-full transition-colors relative",
                                          answers[q.id] ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"
                                       )}
                                    >
                                       <div className={clsx(
                                          "absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform",
                                          answers[q.id] ? "translate-x-6" : "translate-x-0"
                                       )}></div>
                                    </button>
                                 )}

                                 {/* RATING */}
                                 {q.type === 'rating' && (
                                    <div className="flex gap-2">
                                       {[1,2,3,4,5].map(star => (
                                          <button
                                             key={star}
                                             onClick={() => handleInputChange(q.id, star)}
                                             className="transition-transform hover:scale-110 active:scale-95"
                                          >
                                             <Star 
                                                size={32} 
                                                className={clsx(
                                                   "transition-colors", 
                                                   (answers[q.id] || 0) >= star ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"
                                                )} 
                                             />
                                          </button>
                                       ))}
                                    </div>
                                 )}

                                 {/* SELECT */}
                                 {q.type === 'select' && (
                                     <div className="relative">
                                         <select 
                                             value={answers[q.id] || ''}
                                             onChange={e => handleInputChange(q.id, e.target.value)}
                                             className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
                                         >
                                             <option value="" disabled>请选择...</option>
                                             {q.options?.map((opt, i) => (
                                                 <option key={i} value={opt.value}>{opt.label}</option>
                                             ))}
                                         </select>
                                         <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                                     </div>
                                 )}

                                 {/* DATE */}
                                 {q.type === 'date' && (
                                    <input 
                                       type="date"
                                       className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                       value={answers[q.id] || ''}
                                       onChange={e => handleInputChange(q.id, e.target.value)}
                                    />
                                 )}

                                 {/* FILE */}
                                 {q.type === 'file' && (
                                    <div className="space-y-2">
                                       {answers[q.id] ? (
                                          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                             <FileText className="text-emerald-500" />
                                             <a href={answers[q.id]} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-sm text-blue-500 hover:underline">
                                                {answers[q.id].split('/').pop()}
                                             </a>
                                             <button onClick={() => handleInputChange(q.id, '')} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><X size={16} /></button>
                                          </div>
                                       ) : (
                                          <div className="relative">
                                             <input 
                                                type="file" 
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={e => e.target.files?.[0] && handleFileUpload(q.id, e.target.files[0])}
                                             />
                                             <div className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-emerald-500 transition-colors text-gray-500">
                                                {uploading[q.id] ? <><Loader2 className="animate-spin" /> 上传中...</> : <><Upload size={20} /> 点击上传 (Max 10MB)</>}
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                 )}
                              </div>
                           </>
                        )}
                     </div>
                  ))}
               </div>

               {/* Action Buttons */}
               <div className="mt-10 flex justify-between items-center pt-6 border-t border-gray-100 dark:border-gray-800">
                  <button 
                     onClick={handlePrev} 
                     disabled={currentPageIndex === 0}
                     className={clsx(
                        "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors",
                        currentPageIndex === 0 ? "opacity-0 pointer-events-none" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                     )}
                  >
                     <ChevronLeft size={20} /> 上一步
                  </button>

                  <button
                     onClick={handleNext}
                     disabled={submitting}
                     className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                  >
                     {submitting ? (
                        <><Loader2 className="animate-spin" /> 提交中...</>
                     ) : (
                        isLastPage ? <>提交问卷 <Send size={20} /></> : <>下一步 <ChevronRight size={20} /></>
                     )}
                  </button>
               </div>
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );
};

export default FormDetailClient;
