// Website enquiries (the public site's contact form) as staff see them in CRM.
// Mixed into TrinityApp, so `this` is the app.
import { supabase } from '../lib/supabase';
import { loadDemoEnquiries, updateDemoEnquiry } from '../lib/enquiries';

export const ENQ_STATUS = {
  new: ['New', '#FBF1DD', '#8A6414'],
  contacted: ['Contacted', '#E9EFFA', '#3559A8'],
  converted: ['Lead created', '#E6F4EC', '#1F7549'],
  closed: ['Closed', '#F1EEF6', '#6E6A7C']
};

export const enquiryMethods = {
  async loadEnquiries() {
    if (!supabase) { this.setState({ enquiries: loadDemoEnquiries() }); return; }
    this.setState({ enquiriesBusy: true });
    const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) { this.setState({ enquiriesBusy: false, enquiries: this.state.enquiries || [] }); this.toast('Could not load website enquiries'); return; }
    this.setState({ enquiries: data, enquiriesBusy: false });
  },

  async setEnquiryStatus(q, status, quiet) {
    const changes = { status, handled_at: new Date().toISOString() };
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      const { error } = await supabase.from('enquiries').update(Object.assign({ handled_by: data && data.user ? data.user.id : null }, changes)).eq('id', q.id);
      if (error) { this.toast('Could not update the enquiry'); return; }
      this.setState(x => ({ enquiries: (x.enquiries || []).map(e => (e.id === q.id ? Object.assign({}, e, changes) : e)) }));
    } else {
      this.setState({ enquiries: updateDemoEnquiry(q.id, changes) });
    }
    if (!quiet) this.toast(q.name + ' · ' + ENQ_STATUS[status][0].toLowerCase());
  },

  // Opens the New lead form filled in from the enquiry; the enquiry is marked once the lead is saved.
  enquiryToLead(q) {
    const t = [q.service && q.service !== 'Something else' ? q.service : 'Website enquiry', q.event_date].filter(Boolean).join(' · ');
    this.openModal('lead', { c: q.company || q.name, t, src: 'Website', enq: q.id });
  },

  // Called after the New lead form is saved.
  enquiryLeadSaved(id) {
    const q = (this.state.enquiries || []).find(e => e.id === id);
    if (q) this.setEnquiryStatus(q, 'converted', true);
  }
};
