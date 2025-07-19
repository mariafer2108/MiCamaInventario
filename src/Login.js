import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import { supabase } from './supabaseClient';

// Lista de emails autorizados - MODIFICA ESTA LISTA
const AUTHORIZED_EMAILS = [
  'carolina29barriga@gmail.com',
  'navarromunoz.mariafer@gmail.com',
];

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  // En la función validateForm, agrega esta validación:
  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Por favor, completa todos los campos');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError('Por favor ingresa un email válido');
      return false;
    }
  
    // Validación de email autorizado - CORREGIDO
    if (!AUTHORIZED_EMAILS.includes(formData.email.toLowerCase())) {
      setError('Este email no está autorizado para acceder al sistema.');
      return false;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Iniciar sesión con Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Email o contraseña incorrectos');
          } else {
            setError('Error de autenticación. Verifica tus credenciales.');
          }
        } else {
          onLogin(data.user);
        }
      } else {
        // Mostrar mensaje para registro
        setError('El registro está deshabilitado. Solo usuarios autorizados pueden acceder. Contacta al administrador si necesitas acceso.');
      }
    } catch (error) {
      setError('Error en el servidor. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #f59e0b 100%)'}}>
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl p-8 card-shadow">
          <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 bg-white rounded-xl flex items-center justify-center mb-6 shadow-lg p-3 border-2 border-blue-200">
              <img 
                src="/img/micama.jpg" 
                alt="MiCama Logo" 
                className="h-14 w-14 object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </h2>
            <p className="text-gray-600 mt-2 text-lg">
              {isLogin ? 'Accede a tu inventario ✨' : 'Crea tu cuenta para comenzar 🚀'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ingresa tu email"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ingresa tu contraseña"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirma tu contraseña"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full gold-gradient text-white py-4 px-6 rounded-lg hover:shadow-xl focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-300 font-semibold text-lg"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  {isLogin ? <User className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                  {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ email: '', password: '', confirmPassword: '' });
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              disabled={isLoading}
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;