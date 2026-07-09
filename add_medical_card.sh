sed -i '/{activeLauncher === "report-fraud"/i \
          {/* Card 5: Medical Sector */}\
          <button\
            onClick={() => {\
              if (onNavigateToTab) onNavigateToTab("medical");\
            }}\
            className={`text-right p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden group cursor-pointer bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-950/5 hover:-translate-y-1`}\
          >\
            <div className="absolute top-[-20%] left-[-10%] w-24 h-24 bg-rose-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>\
            <div className="flex items-center justify-between mb-4">\
              <span className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 text-xl font-bold group-hover:scale-110 transition-transform">\
                <HeartPulse className="w-6 h-6" />\
              </span>\
              <span className="text-[9px] bg-rose-500/10 text-rose-700 dark:text-rose-400 px-2.5 py-1 rounded-full font-black">\
                القطاع العلاجي\
              </span>\
            </div>\
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-2">\
              المرضى والمعدات الطبية\
            </h3>\
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">\
              بوابة متكاملة لمتابعة المرضى، توفير الأدوية، وصيانة وتجهيز المعدات الطبية بالمستشفيات.\
            </p>\
          </button>\
' src/components/LandingView.tsx
