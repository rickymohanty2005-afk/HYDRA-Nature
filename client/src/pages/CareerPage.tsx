import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  MapPin,
  Briefcase,
  CheckCircle2,
  X,
  Upload,
  FileText,
  Clock,
  Sparkles,
  Link as LinkIcon,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { careerService } from '../services/careerService';
import { Career } from '../types';

// Deep-ocean teal water, shared with the footer
const HERO_WATER =
  'radial-gradient(ellipse 70% 45% at 50% -5%, #1E9AA3 0%, rgba(30,154,163,0) 70%),' +
  'radial-gradient(ellipse 45% 40% at 85% 10%, rgba(64,190,198,0.55) 0%, rgba(64,190,198,0) 70%),' +
  'radial-gradient(ellipse 50% 50% at 10% 40%, rgba(11,85,96,0.9) 0%, rgba(11,85,96,0) 70%),' +
  'linear-gradient(180deg, #0B5560 0%, #06373F 45%, #031F26 100%)';

export const CareerPage: React.FC = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState('All');

  // Application Modal state
  const [selectedJob, setSelectedJob] = useState<Career | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  // Resume Upload state
  const [resumeMode, setResumeMode] = useState<'upload' | 'link'>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadedResumeInfo, setUploadedResumeInfo] = useState<{
    originalName: string;
    url: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message?: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCareers = async () => {
    try {
      setLoading(true);
      const data = await careerService.getAll({ all: false });
      setCareers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching careers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
  }, []);

  // Departments list dynamically gathered
  const departments = ['All', ...Array.from(new Set(careers.map((c) => c.department).filter(Boolean)))];

  const filteredCareers =
    selectedDepartment === 'All'
      ? careers
      : careers.filter((c) => c.department === selectedDepartment);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 15MB
    if (file.size > 15 * 1024 * 1024) {
      setSubmitStatus({
        success: false,
        message: 'File size exceeds 15MB limit. Please upload a smaller document.',
      });
      return;
    }

    setResumeFile(file);
    setSubmitStatus({});
    setUploadingResume(true);

    try {
      const uploadRes = await careerService.uploadResume(file);
      if (uploadRes.success && (uploadRes.resumeUrl || uploadRes.relativeUrl)) {
        const finalUrl = uploadRes.resumeUrl || uploadRes.relativeUrl;
        setResumeUrl(finalUrl);
        setUploadedResumeInfo({
          originalName: file.name,
          url: finalUrl,
        });
      }
    } catch (err: any) {
      console.error('Resume upload error:', err);
      setSubmitStatus({
        success: false,
        message: err.response?.data?.message || err.message || 'Failed to upload resume file.',
      });
      setResumeFile(null);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    let finalResumeUrl = resumeUrl.trim();

    // If a file is chosen but hasn't uploaded yet
    if (resumeMode === 'upload' && resumeFile && !finalResumeUrl) {
      setUploadingResume(true);
      try {
        const uploadRes = await careerService.uploadResume(resumeFile);
        finalResumeUrl = uploadRes.resumeUrl || uploadRes.relativeUrl;
        setResumeUrl(finalResumeUrl);
      } catch (err: any) {
        setUploadingResume(false);
        setSubmitStatus({
          success: false,
          message: 'Please upload your resume before submitting.',
        });
        return;
      }
      setUploadingResume(false);
    }

    if (!finalResumeUrl) {
      setSubmitStatus({
        success: false,
        message: 'Please attach your resume file or provide a valid resume link.',
      });
      return;
    }

    setSubmitting(true);
    setSubmitStatus({});

    try {
      const res = await careerService.apply({
        careerId: selectedJob._id,
        jobTitle: selectedJob.title,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        resumeUrl: finalResumeUrl,
        portfolioUrl: portfolioUrl.trim() || undefined,
        coverLetter: coverLetter.trim() || undefined,
      });

      setSubmitStatus({
        success: true,
        message: res.message || 'Application submitted successfully! Our talent team will review your application.',
      });

      // Clear form after success
      setTimeout(() => {
        setSelectedJob(null);
        setFullName('');
        setEmail('');
        setPhone('');
        setResumeUrl('');
        setResumeFile(null);
        setUploadedResumeInfo(null);
        setPortfolioUrl('');
        setCoverLetter('');
        setSubmitStatus({});
      }, 3000);
    } catch (err: any) {
      setSubmitStatus({
        success: false,
        message: err.response?.data?.message || err.message || 'Submission failed. Please check your inputs.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF8F5] pb-24 text-[#13382B]">
      {/* 1. CAREER HERO BANNER */}
      <section className="relative isolate overflow-hidden bg-[#06373F] py-14 sm:py-20">
        <div className="absolute inset-0 -z-10" style={{ background: HERO_WATER }} aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <span className="text-xs font-semibold tracking-widest text-[#6FE4E8] uppercase">
              Careers at Hydra
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-medium text-white leading-tight">
              Join Our Team
            </h1>
            <p className="text-sm sm:text-base text-[#D3EEEE] leading-relaxed">
              Grow with Hydra. Be a part of our innovative journey redefining clean botanical
              dermatology across India and beyond.
            </p>
            <div className="pt-2">
              <a
                href="#openings"
                className="inline-flex items-center gap-2 px-7 py-3 bg-white text-[#031F26] rounded-full text-xs font-semibold hover:bg-[#D3EEEE] hover:shadow-[0_10px_30px_-10px_rgba(111,228,232,0.8)] transition-all shadow-md"
              >
                <span>Explore Careers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="relative w-56 sm:w-72 h-44 sm:h-56 rounded-3xl overflow-hidden shadow-[0_20px_50px_-20px_rgba(2,20,25,0.8)] border border-white/15 flex-shrink-0 flex items-center justify-center bg-white/[0.07] backdrop-blur-xl p-3">
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=700&q=80"
              alt="Hydra Collaborative Headquarters"
              className="w-full h-full object-cover rounded-2xl"
            />
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-[#031F26] shadow-sm">
              Build • Innovate • Grow
            </div>
          </div>
        </div>
      </section>

      {/* 2. CURRENT OPENINGS SECTION */}
      <section id="openings" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-[#EDE8E1]">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#13382B]">
              Current Openings
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Explore active positions across our engineering, product, and laboratory teams.
            </p>
          </div>

          {/* Department Filter Pills */}
          {departments.length > 2 && (
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedDepartment === dept
                      ? 'bg-[#13382B] text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-[#EDE8E1] hover:border-[#13382B]'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Job Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-white rounded-3xl animate-pulse border border-[#EDE8E1]" />
            ))}
          </div>
        ) : filteredCareers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCareers.map((job) => (
              <div
                key={job._id}
                className="bg-white rounded-3xl p-6 border border-[#EDE8E1] shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-3 py-1 bg-[#EAF1EB] text-[#2E6B48] rounded-full">
                      {job.department}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {job.type}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-[#13382B] leading-snug group-hover:text-[#2E6B48] transition-colors">
                    {job.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{job.location}</span>
                    </div>
                    {job.experience && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{job.experience}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed pt-1">
                    {job.description}
                  </p>

                  {job.requirements && job.requirements.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[11px] font-semibold text-gray-700 mb-1.5">Key Highlights:</p>
                      <ul className="space-y-1">
                        {job.requirements.slice(0, 2).map((req, idx) => (
                          <li key={idx} className="text-[11px] text-gray-500 flex items-start gap-1.5">
                            <span className="text-[#2E6B48] font-bold">•</span>
                            <span className="line-clamp-1">{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-100 mt-6">
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setSubmitStatus({});
                      setResumeFile(null);
                      setUploadedResumeInfo(null);
                    }}
                    className="w-full py-2.5 bg-[#FAF8F5] hover:bg-[#13382B] text-[#13382B] hover:text-white border border-[#EDE8E1] rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    <span>Apply for this Position</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#EDE8E1] p-8">
            <Sparkles className="w-10 h-10 text-[#C5A880] mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-[#13382B]">No open positions found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              We don't have openings matching this category right now, but we are always looking for passionate people. Check back frequently!
            </p>
          </div>
        )}
      </section>

      {/* 3. INTERACTIVE APPLICATION MODAL WITH ATTACHED RESUME UPLOAD */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#EDE8E1] shadow-2xl relative my-8 animate-scale-in">
            <button
              onClick={() => setSelectedJob(null)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-[11px] font-bold text-[#2E6B48] uppercase tracking-wider">
                Application Form
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#13382B] mt-1">
                Apply for {selectedJob.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                <span>{selectedJob.department}</span>
                <span>•</span>
                <span>{selectedJob.location}</span>
                <span>•</span>
                <span>{selectedJob.type}</span>
              </p>
            </div>

            {submitStatus.success ? (
              <div className="p-8 bg-[#EAF1EB] text-[#2E6B48] rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 mx-auto text-[#2E6B48]" />
                <h4 className="font-serif text-xl font-bold">Application Received!</h4>
                <p className="text-xs text-gray-700 leading-relaxed max-w-md mx-auto">
                  {submitStatus.message}
                </p>
                <div className="pt-2">
                  <span className="text-[11px] text-gray-500">Closing automatically...</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priyanshu Mohanty"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B] bg-[#FAF8F5]/50"
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. candidate@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B] bg-[#FAF8F5]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B] bg-[#FAF8F5]/50"
                    />
                  </div>
                </div>

                {/* RESUME UPLOAD SECTION (ATTACHED FILE OR URL) */}
                <div className="bg-[#FAF8F5] border border-[#EDE8E1] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#13382B] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#2E6B48]" />
                      <span>Resume / Curriculum Vitae</span>
                      <span className="text-red-500">*</span>
                    </label>

                    {/* Mode switcher */}
                    <div className="flex items-center gap-1 bg-white border border-[#EDE8E1] p-0.5 rounded-lg text-[10px]">
                      <button
                        type="button"
                        onClick={() => setResumeMode('upload')}
                        className={`px-2 py-0.5 rounded font-medium transition-all ${
                          resumeMode === 'upload'
                            ? 'bg-[#13382B] text-white'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setResumeMode('link')}
                        className={`px-2 py-0.5 rounded font-medium transition-all ${
                          resumeMode === 'link'
                            ? 'bg-[#13382B] text-white'
                            : 'text-gray-500 hover:text-gray-900'
                        }`}
                      >
                        Or Paste Link
                      </button>
                    </div>
                  </div>

                  {resumeMode === 'upload' ? (
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        className="hidden"
                      />

                      {uploadedResumeInfo ? (
                        <div className="flex items-center justify-between bg-white border border-green-200 rounded-xl p-3 shadow-sm">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-semibold text-[#13382B] truncate">
                                {uploadedResumeInfo.originalName}
                              </p>
                              <p className="text-[10px] text-green-700 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Attached & uploaded successfully
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setResumeFile(null);
                              setUploadedResumeInfo(null);
                              setResumeUrl('');
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-[#D2C9BD] hover:border-[#13382B] bg-white rounded-xl p-4 text-center cursor-pointer transition-colors group"
                        >
                          {uploadingResume ? (
                            <div className="flex flex-col items-center gap-2 py-2 text-gray-500">
                              <Loader2 className="w-6 h-6 animate-spin text-[#13382B]" />
                              <span className="text-xs font-medium">Uploading attached resume...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5 py-2">
                              <div className="w-9 h-9 rounded-full bg-[#FAF8F5] text-[#13382B] flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="w-4 h-4" />
                              </div>
                              <p className="text-xs font-bold text-[#13382B]">
                                Click to attach your Resume / CV
                              </p>
                              <p className="text-[10px] text-gray-400">
                                Supports PDF, DOC, DOCX up to 15MB
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <LinkIcon className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="url"
                          placeholder="https://drive.google.com/your-resume-link"
                          value={resumeUrl}
                          onChange={(e) => {
                            setResumeUrl(e.target.value);
                            setUploadedResumeInfo(null);
                          }}
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B] bg-white"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Ensure sharing access is set to "Anyone with the link can view".
                      </p>
                    </div>
                  )}
                </div>

                {/* Portfolio or LinkedIn Link */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Portfolio / GitHub / LinkedIn (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username or portfolio link"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B] bg-[#FAF8F5]/50"
                  />
                </div>

                {/* Cover Note */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Why do you want to build Hydra? (Cover Note)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us what excites you about clean skincare, your past achievements, or what you bring to the team..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs border border-[#EDE8E1] rounded-xl focus:outline-none focus:border-[#13382B] bg-[#FAF8F5]/50 resize-none"
                  />
                </div>

                {/* Error Banner */}
                {submitStatus.message && !submitStatus.success && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{submitStatus.message}</span>
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="px-5 py-2.5 border border-gray-300 rounded-full text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploadingResume}
                    className="px-7 py-2.5 bg-[#13382B] text-white rounded-full text-xs font-semibold hover:bg-[#1E4D3B] disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <span>Submit Application</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerPage;
