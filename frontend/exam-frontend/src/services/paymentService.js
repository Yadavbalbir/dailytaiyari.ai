import api from './api'

/**
 * Payment service — starts checkout for pay-to-enrol (paid) courses and
 * verifies the result. Supports Razorpay and Cashfree. The provider SDK is
 * loaded lazily the first time it is needed.
 */

const SDK_SRC = {
    razorpay: 'https://checkout.razorpay.com/v1/checkout.js',
    cashfree: 'https://sdk.cashfree.com/js/v3/cashfree.js',
}

const loadedScripts = {}

function loadScript(src) {
    if (loadedScripts[src]) return loadedScripts[src]
    loadedScripts[src] = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`)
        if (existing) {
            resolve()
            return
        }
        const el = document.createElement('script')
        el.src = src
        el.async = true
        el.onload = () => resolve()
        el.onerror = () => {
            delete loadedScripts[src]
            reject(new Error(`Failed to load ${src}`))
        }
        document.body.appendChild(el)
    })
    return loadedScripts[src]
}

async function createOrder(courseId) {
    const { data } = await api.post('/payments/orders/', { course: courseId })
    return data // { order, checkout }
}

async function verifyOrder(orderId, payload = {}) {
    const { data } = await api.post(`/payments/orders/${orderId}/verify/`, payload)
    return data // { status, enrolled }
}

/** Open Razorpay checkout and resolve with the verified result. */
function payWithRazorpay({ checkout, orderId, course, user }) {
    return new Promise(async (resolve, reject) => {
        try {
            await loadScript(SDK_SRC.razorpay)
        } catch (e) {
            reject(e)
            return
        }
        if (!window.Razorpay) {
            reject(new Error('Razorpay SDK unavailable'))
            return
        }
        const rzp = new window.Razorpay({
            key: checkout.key_id,
            order_id: checkout.order_id,
            amount: checkout.amount,
            currency: checkout.currency,
            name: course?.name || 'Course enrolment',
            description: course?.name || '',
            prefill: {
                name: user?.full_name || '',
                email: user?.email || '',
            },
            theme: { color: '#f97316' },
            handler: async (response) => {
                try {
                    const result = await verifyOrder(orderId, {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                    })
                    resolve(result)
                } catch (err) {
                    reject(err)
                }
            },
            modal: {
                ondismiss: () => reject(new Error('cancelled')),
            },
        })
        rzp.on('payment.failed', () => reject(new Error('payment_failed')))
        rzp.open()
    })
}

/** Open Cashfree checkout and resolve with the verified result. */
async function payWithCashfree({ checkout, orderId }) {
    await loadScript(SDK_SRC.cashfree)
    if (!window.Cashfree) throw new Error('Cashfree SDK unavailable')
    const cashfree = window.Cashfree({ mode: checkout.mode === 'production' ? 'production' : 'sandbox' })
    const res = await cashfree.checkout({
        paymentSessionId: checkout.payment_session_id,
        redirectTarget: '_modal',
    })
    if (res?.error) {
        // User closed the modal or payment failed.
        throw new Error(res.error?.message || 'cancelled')
    }
    // Confirm authoritatively on the server (Cashfree has no client signature).
    return verifyOrder(orderId, { order_id: checkout.order_id })
}

/**
 * Run the full checkout flow for a paid course. Returns the verified result
 * ({ status: 'paid', enrolled: true }) or throws on cancel/failure.
 */
async function checkout(course, user) {
    const { order, checkout: checkoutParams } = await createOrder(course.id)
    const provider = checkoutParams.provider
    if (provider === 'razorpay') {
        return payWithRazorpay({ checkout: checkoutParams, orderId: order.id, course, user })
    }
    if (provider === 'cashfree') {
        return payWithCashfree({ checkout: checkoutParams, orderId: order.id })
    }
    throw new Error(`Unsupported provider: ${provider}`)
}

export const paymentService = {
    createOrder,
    verifyOrder,
    checkout,
}
